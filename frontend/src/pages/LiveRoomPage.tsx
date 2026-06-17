import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

interface ChatMsg {
  id: number
  user_id: number
  user_name: string
  message: string
  created_at: string
}

export default function LiveRoomPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const wsRef = useRef<WebSocket | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [isTeacher, setIsTeacher] = useState(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSession = useCallback(async () => {
    try {
      const res = await api.get(`/live/sessions/${id}/`)
      const s = res.data
      setSession(s)
      setIsTeacher(user?.role === 'teacher' && s.teacher_id === user?.id)
      if (s.status === 'live') {
        await api.post(`/live/sessions/${id}/join/`).catch(() => {})
      }
    } catch {
      navigate('/live', { replace: true })
      return
    }

    try {
      const msgRes = await api.get(`/live/sessions/${id}/messages/`)
      setMessages(msgRes.data || [])
    } catch {}

    setLoading(false)
  }, [id, user, navigate])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws/live/${id}/`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', user_id: user?.id, user_name: `${user?.first_name} ${user?.last_name}` }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, {
          id: data.id,
          user_id: data.user_id,
          user_name: data.user_name,
          message: data.message,
          created_at: data.created_at,
        }])
      }
    }

    ws.onclose = () => {}

    return () => {
      ws.close()
    }
  }, [id, user])

  useEffect(() => {
    if (!isTeacher) return
    startMedia()
    return () => stopMedia()
  }, [isTeacher])

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch {}
  }

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getVideoTracks()
      tracks.forEach(t => { t.enabled = !t.enabled })
      setCameraOn(prev => !prev)
    }
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks()
      tracks.forEach(t => { t.enabled = !t.enabled })
      setMicOn(prev => !prev)
    }
  }

  const sendMessage = () => {
    const text = msgInput.trim()
    if (!text || !wsRef.current) return
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: text,
      user_id: user?.id,
      user_name: `${user?.first_name} ${user?.last_name}`,
    }))
    setMsgInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleLeave = async () => {
    stopMedia()
    try {
      await api.post(`/live/sessions/${id}/leave/`)
    } catch {}
    wsRef.current?.close()
    navigate('/live')
  }

  useEffect(() => {
    return () => {
      stopMedia()
      api.post(`/live/sessions/${id}/leave/`).catch(() => {})
      wsRef.current?.close()
    }
  }, [id])

  const handleEndSession = async () => {
    if (!confirm('Terminer et supprimer ce live ?')) return
    stopMedia()
    try {
      await api.post(`/live/sessions/${id}/end/`)
    } catch {}
    wsRef.current?.close()
    navigate('/live')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!session) {
    return <div className="text-center py-12 text-gray-400">Session introuvable</div>
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 animate-fadeIn">
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="bg-gray-900 rounded-2xl flex-1 flex items-center justify-center relative overflow-hidden">
          {isTeacher ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="text-white/60 text-center">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">{session.title}</p>
              <p className="text-sm opacity-60 mt-1">{session.teacher_name}</p>
              <p className="text-xs opacity-40 mt-4">En tant que participant, vous pouvez suivre le live et discuter dans le chat</p>
            </div>
          )}
          {session.status === 'live' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white text-xs font-medium">EN DIRECT</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
          {isTeacher && (
            <>
              <button onClick={toggleCamera} className={`p-3 rounded-xl transition-all ${cameraOn ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-red-50 text-red-600'}`} title="Caméra">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {cameraOn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  )}
                </svg>
              </button>
              <button onClick={toggleMic} className={`p-3 rounded-xl transition-all ${micOn ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-red-50 text-red-600'}`} title="Microphone">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {micOn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>
              <div className="w-px h-8 bg-gray-200 mx-1" />
            </>
          )}
          <button onClick={handleLeave} className="bg-red-50 text-red-600 hover:bg-red-100 px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
            Quitter
          </button>
          {isTeacher && (
            <button onClick={handleEndSession} className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
              Terminer le live
            </button>
          )}
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Chat en direct</h3>
          <p className="text-xs text-gray-400 mt-0.5">{messages.length} message(s)</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-8">Aucun message pour le moment</p>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.user_id === user?.id ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                <p className={`text-xs font-medium mb-0.5 ${msg.user_id === user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.user_name}</p>
                <p className="leading-relaxed">{msg.message}</p>
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
              className="input flex-1 text-sm"
            />
            <button onClick={sendMessage} disabled={!msgInput.trim()} className="btn-primary text-sm px-4 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
