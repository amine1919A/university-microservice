import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function SubjectsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', coefficient: '1' })
  const [createError, setCreateError] = useState('')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) { navigate('/', { replace: true }); return }
    Promise.all([
      api.get('/subjects/'),
      api.get('/subjects/assignments/'),
      api.get('/users/teachers/'),
    ]).then(([sr, ar, tr]) => {
      setSubjects(Array.isArray(sr.data) ? sr.data : sr.data.results || [])
      setAssignments(Array.isArray(ar.data) ? ar.data : ar.data.results || [])
      setTeachers(Array.isArray(tr.data) ? tr.data : tr.data.results || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAdmin, navigate])

  const createSubject = async () => {
    setCreateError('')
    if (!form.name || !form.code) { setCreateError('Nom et code requis'); return }
    if (subjects.some(s => s.name.toLowerCase() === form.name.toLowerCase())) {
      setCreateError(`La matière "${form.name}" existe déjà`)
      return
    }
    try {
      await api.post('/subjects/', { name: form.name, code: form.code, coefficient: parseFloat(form.coefficient) })
      setShowCreate(false); setForm({ name: '', code: '', coefficient: '1' })
      const r = await api.get('/subjects/'); setSubjects(Array.isArray(r.data) ? r.data : r.data.results || [])
    } catch (err: any) {
      const d = err.response?.data
      setCreateError(d ? Object.values(d).flat().join(', ') : "Erreur")
    }
  }

  const deleteSubject = async (id: number) => {
    if (!confirm('Supprimer cette matière ?')) return
    try { await api.delete(`/subjects/${id}/`); setSubjects(prev => prev.filter(s => s.id !== id)) } catch {}
  }

  const deleteAssignment = async (id: number) => {
    try { await api.delete(`/subjects/assignments/${id}/`); setAssignments(prev => prev.filter(a => a.id !== id)) } catch {}
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Matières</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm py-2.5">+ Nouvelle matière</button>
          </div>
        )}
      </div>

      {showCreate && isAdmin && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <h3 className="font-bold text-gray-800">Créer une matière</h3>
          {createError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{createError}</div>}
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="Nom (ex: Mathématiques)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" />
            <input placeholder="Code (ex: MATH)" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="input" />
            <input type="number" step="0.5" placeholder="Coefficient" value={form.coefficient} onChange={e => setForm(p => ({ ...p, coefficient: e.target.value }))} className="input" />
          </div>
          <div className="flex gap-3">
            <button onClick={createSubject} className="btn-primary">Créer</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? [...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse"><div className="h-5 bg-gray-200 rounded w-32 mb-2" /><div className="h-4 bg-gray-100 rounded w-20" /></div>
        )) : subjects.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">Aucune matière. Créez des enseignants avec des spécialités pour générer des matières automatiquement.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Matières ({subjects.length})</h2>
              {subjects.map((s: any) => {
                const teacherCount = teachers.filter((t: any) =>
                  t.specialization?.toLowerCase() === s.name.toLowerCase()
                ).length
                return (
                  <div key={s.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {s.name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm">{s.name}</h3>
                        <p className="text-xs text-gray-400">{s.code} · Coef {s.coefficient} · {teacherCount} enseignant(s)</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => deleteSubject(s.id)} className="text-xs text-red-500 hover:text-red-700 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Assignations ({assignments.length})</h2>
              {assignments.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">Créez une classe et utilisez l'assistant de création pour assigner des matières</div>
              ) : (
                assignments.map((a: any) => (
                  <div key={a.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{a.subject_name}</h3>
                      <p className="text-xs text-gray-500">{a.class_name} · {a.teacher_name} · {a.hours_per_week}h/sem</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => deleteAssignment(a.id)} className="text-xs text-red-500 hover:text-red-700 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
