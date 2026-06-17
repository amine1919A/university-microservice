import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Conversation {
  id: number
  participants: number[]
  subject: string
  last_message: any
  unread_count: number
  created_at: string
  updated_at: string
}

interface Message {
  id: number
  conversation: number
  sender_id: number
  sender_name: string
  content: string
  is_read: boolean
  created_at: string
}

interface Contact {
  id: number
  first_name: string
  last_name: string
  tag: string
  tag_type: 'class' | 'subject'
  role: string
}

interface UserInfo {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
}

export default function MessagesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [userMap, setUserMap] = useState<Record<number, UserInfo>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/auth/users/').then(r => {
      const users: UserInfo[] = Array.isArray(r.data) ? r.data : r.data.results || []
      const map: Record<number, UserInfo> = {}
      users.forEach(u => { map[u.id] = u })
      setUserMap(map)
    }).catch(() => {})
    api.get('/messaging/conversations/').then(r => setConvs(r.data.results || r.data || [])).catch(() => {}).finally(() => setLoading(false))
    api.get('/messaging/contacts/').then(r => setContacts(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedConv) return
    api.get(`/messaging/conversations/${selectedConv}/`).then(r => {
      setMessages(r.data.messages || [])
      api.post(`/messaging/conversations/${selectedConv}/read/`)
    }).catch(() => {})
  }, [selectedConv])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const getOtherParticipant = (conv: Conversation): UserInfo | undefined => {
    if (!user) return undefined
    const otherId = conv.participants.find(p => p !== user.id)
    return otherId ? userMap[otherId] : undefined
  }

  const getConvTitle = (conv: Conversation): string => {
    const other = getOtherParticipant(conv)
    if (other) return `${other.first_name} ${other.last_name}`
    return conv.subject || `Conversation #${conv.id}`
  }

  const sendMessage = async () => {
    if (!newMsg.trim()) return
    try {
      const r = await api.post('/messaging/send/', {
        conversation_id: selectedConv,
        content: newMsg,
      })
      setMessages(prev => [...prev, r.data])
      setNewMsg('')
    } catch {}
  }

  const startConversation = async (contact: Contact) => {
    try {
      const r = await api.post('/messaging/send/', {
        recipient_id: contact.id,
        subject: `${contact.first_name} ${contact.last_name}`,
        content: 'Bonjour !',
      })
      setSelectedConv(r.data.conversation)
      setShowNew(false)
      setMessages(prev => [...prev, r.data])
      const res = await api.get('/messaging/conversations/')
      setConvs(res.data.results || res.data || [])
    } catch {}
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.tag}`.toLowerCase().includes(search.toLowerCase())
  )

  const tagColors: Record<string, string> = {
    class: 'bg-emerald-50 text-emerald-700',
    subject: 'bg-indigo-50 text-indigo-700',
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] animate-fadeIn gap-4">
      <div className="w-80 shrink-0 card flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Messages</h2>
          <button onClick={() => { setShowNew(true); setSelectedConv(null) }} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? [...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl animate-pulse"><div className="h-4 bg-gray-200 rounded w-24 mb-2" /><div className="h-3 bg-gray-100 rounded w-40" /></div>
          )) : convs.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Aucune conversation</p>
          ) : convs.map(c => {
            const other = getOtherParticipant(c)
            return (
              <button key={c.id} onClick={() => { setSelectedConv(c.id); setShowNew(false) }}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedConv === c.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {other ? `${other.first_name?.[0]}${other.last_name?.[0]}` : '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{getConvTitle(c)}</p>
                      {c.unread_count > 0 && <span className="bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1 shrink-0">{c.unread_count}</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message?.content || 'Aucun message'}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 card flex flex-col">
        {showNew ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nouveau message</h3>
            <input type="text" placeholder="Rechercher un contact..." value={search} onChange={e => setSearch(e.target.value)}
              className="input-field mb-3" autoFocus />
            <div className="flex-1 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Aucun contact trouvé</p>
              ) : filtered.map(c => (
                <button key={`${c.role}-${c.id}`} onClick={() => startConversation(c)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.first_name} {c.last_name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${tagColors[c.tag_type] || 'bg-gray-100 text-gray-600'}`}>
                        {c.tag || (c.role === 'teacher' ? 'Enseignant' : 'Étudiant')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 capitalize">{c.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowNew(false)} className="btn-secondary w-full mt-3">Annuler</button>
          </div>
        ) : !selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              {(() => {
                const conv = convs.find(c => c.id === selectedConv)
                const other = conv ? getOtherParticipant(conv) : undefined
                return (
                  <>
                    {other && (
                      <button onClick={() => navigate(`/profile/${other.id}`)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 hover:opacity-80">
                        {other.first_name?.[0]}{other.last_name?.[0]}
                      </button>
                    )}
                    <h3 className="font-semibold text-gray-800">{conv ? getConvTitle(conv) : ''}</h3>
                  </>
                )
              })()}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${m.sender_id === user?.id ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    {m.sender_id !== user?.id && (
                      <button onClick={() => navigate(`/profile/${m.sender_id}`)}
                        className="text-xs font-medium mb-1 opacity-70 hover:opacity-100">{m.sender_name}</button>
                    )}
                    <p className="text-sm">{m.content}</p>
                    <p className={`text-xs mt-1 ${m.sender_id === user?.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-3">
                <input type="text" placeholder="Écrivez votre message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                  className="input-field flex-1" />
                <button onClick={sendMessage} disabled={!newMsg.trim()} className="btn-primary px-5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}