import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Session {
  id: number
  title: string
  description: string
  class_id: number | null
  teacher_id: number
  teacher_name: string
  status: string
  scheduled_at: string | null
  started_at: string | null
  created_at: string
  participant_count?: number
}

export default function LivePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', class_id: '', scheduled_at: '' })
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        let classFilter = ''
        if (user?.role === 'teacher') {
          const [classesData, assignments] = await Promise.all([
            api.get('/classes/').catch(() => null),
            api.get('/subjects/assignments/').catch(() => null),
          ])
          const allClasses = classesData?.data?.results || classesData?.data || []
          const allAssignments = assignments?.data?.results || assignments?.data || []
          const myIds = [...new Set(allAssignments.filter((a: any) => a.teacher_external_id === user?.id).map((a: any) => a.class_external_id))]
          setTeacherClasses(allClasses.filter((c: any) => myIds.includes(c.id)))
        }
        const r = await api.get(`/live/sessions/${classFilter}`)
        setSessions(r.data.results || r.data || [])
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const createSession = async () => {
    if (!form.title.trim()) return
    try {
      const payload: any = { title: form.title, description: form.description }
      if (form.class_id) payload.class_id = parseInt(form.class_id)
      const r = await api.post('/live/sessions/', payload)
      setSessions(prev => [r.data, ...prev])
      setShowCreate(false)
      setForm({ title: '', description: '', class_id: '', scheduled_at: '' })
    } catch {}
  }

  const startSession = async (id: number) => {
    try {
      const r = await api.post(`/live/sessions/${id}/start/`)
      setSessions(prev => prev.map(s => s.id === id ? r.data : s))
    } catch {}
  }

  const endSession = async (id: number) => {
    try {
      await api.post(`/live/sessions/${id}/end/`)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch {}
  }

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { scheduled: 'bg-amber-50 text-amber-700', live: 'bg-green-50 text-green-700', ended: 'bg-gray-50 text-gray-500' }
    const l: Record<string, string> = { scheduled: 'Planifié', live: 'En direct', ended: 'Terminé' }
    return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${m[status] || ''}`}>
      {status === 'live' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
      {l[status] || status}
    </span>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Live Streaming</h1>
        {user?.role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-2.5">+ Nouveau live</button>
        )}
      </div>

      {showCreate && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <h3 className="font-bold text-gray-800">Créer une session live</h3>
          <input type="text" placeholder="Titre du live" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="input-field" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="input-field" rows={2} />
          <select value={form.class_id} onChange={e => setForm(p => ({...p, class_id: e.target.value}))} className="input-field">
            <option value="">Toutes les classes</option>
            {teacherClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={createSession} className="btn-primary">Créer</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">Aucune session live</div>
        ) : sessions.map((s, i) => (
          <div key={s.id} className={`card p-6 animate-slideUp stagger-${(i % 3) + 1}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                s.status === 'live' ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' :
                s.status === 'ended' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{s.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{s.teacher_name}</p>
                {s.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{s.description}</p>}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {statusBadge(s.status)}
                  {s.status === 'live' && s.participant_count !== undefined && (
                    <span className="text-xs text-gray-400">{s.participant_count} participant(s)</span>
                  )}
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {s.status === 'live' && (
                    <button onClick={() => navigate(`/live/${s.id}`)} className="btn-primary text-sm py-1.5 px-4">
                      Rejoindre
                    </button>
                  )}
                  {user?.role === 'teacher' && s.teacher_id === user?.id && s.status === 'scheduled' && (
                    <button onClick={() => startSession(s.id)} className="btn-primary text-sm py-1.5 px-4">Démarrer</button>
                  )}
                  {user?.role === 'teacher' && s.teacher_id === user?.id && s.status === 'live' && (
                    <button onClick={() => navigate(`/live/${s.id}`)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium px-4 py-2 rounded-lg transition-all">
                      Ouvrir le studio
                    </button>
                  )}
                  {user?.role === 'teacher' && s.teacher_id === user?.id && s.status === 'live' && (
                    <button onClick={() => endSession(s.id)} className="bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium px-4 py-2 rounded-lg transition-all">Terminer</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
