import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSearchParams } from 'react-router-dom'
import type { Complaint } from '../types'

export default function ComplaintsPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject_external_id: '', subject_name: '', grade_type: 'cc', grade_value: '', description: '' })
  const [subjects, setSubjects] = useState<any[]>([])
  const [responding, setResponding] = useState<number | null>(null)
  const [adminResponse, setAdminResponse] = useState('')

  useEffect(() => {
    const subjectId = searchParams.get('subject_id')
    const gradeType = searchParams.get('grade_type')
    const gradeValue = searchParams.get('grade_value')
    if (subjectId && gradeType && gradeValue && user?.role === 'student') {
      const sub = subjects.find(s => s.id === parseInt(subjectId))
      setForm({
        subject_external_id: subjectId,
        subject_name: sub?.name || '',
        grade_type: gradeType,
        grade_value: gradeValue,
        description: '',
      })
      setShowForm(true)
    }
  }, [searchParams, subjects, user?.role])

  useEffect(() => {
    const params = user?.role === 'student' ? `?student_id=${user.id}` : ''
    api.get(`/reclamations/${params}`).then(r => setComplaints(r.data.results || r.data || [])).catch(() => {}).finally(() => setLoading(false))
    api.get('/subjects/').then(r => setSubjects(r.data.results || r.data || [])).catch(() => {})
  }, [user])

  const submitComplaint = async () => {
    if (!form.subject_external_id || !form.grade_value) return
    try {
      const r = await api.post('/reclamations/', {
        subject_external_id: parseInt(form.subject_external_id),
        subject_name: form.subject_name,
        grade_type: form.grade_type,
        grade_value: parseFloat(form.grade_value),
        description: form.description,
      })
      setComplaints(prev => [r.data, ...prev])
      setShowForm(false)
      setForm({ subject_external_id: '', subject_name: '', grade_type: 'cc', grade_value: '', description: '' })
    } catch {}
  }

  const respondToComplaint = async (id: number) => {
    try {
      const r = await api.post(`/reclamations/${id}/respond/`, {
        status: 'resolved',
        admin_response: adminResponse,
      })
      setComplaints(prev => prev.map(c => c.id === id ? r.data : c))
      setResponding(null)
      setAdminResponse('')
    } catch {}
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700',
      reviewed: 'bg-blue-50 text-blue-700',
      resolved: 'bg-green-50 text-green-700',
      rejected: 'bg-red-50 text-red-700',
    }
    const labels: Record<string, string> = {
      pending: 'En attente', reviewed: 'Examiné', resolved: 'Résolu', rejected: 'Rejeté',
    }
    return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>{labels[status] || status}</span>
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Réclamations</h1>
        {user?.role === 'student' && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5">+ Nouvelle réclamation</button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <h3 className="font-bold text-gray-800">Soumettre une réclamation</h3>
          <select value={form.subject_external_id} onChange={e => {
            const sub = subjects.find(s => s.id === parseInt(e.target.value))
            setForm(p => ({ ...p, subject_external_id: e.target.value, subject_name: sub?.name || '' }))
          }} className="input-field">
            <option value="">Sélectionnez une matière</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.grade_type} onChange={e => setForm(p => ({ ...p, grade_type: e.target.value }))} className="input-field">
            <option value="cc">Contrôle continu</option>
            <option value="ds">Devoir surveillé</option>
            <option value="examen">Examen</option>
          </select>
          <input type="number" step="0.01" placeholder="Note concernée" value={form.grade_value}
            onChange={e => setForm(p => ({ ...p, grade_value: e.target.value }))} className="input-field" />
          <textarea placeholder="Description de la réclamation..." value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field" rows={3} />
          <div className="flex gap-3">
            <button onClick={submitComplaint} className="btn-primary">Envoyer</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse"><div className="h-5 bg-gray-200 rounded w-48 mb-3" /><div className="h-4 bg-gray-100 rounded w-full mb-2" /><div className="h-4 bg-gray-100 rounded w-32" /></div>
          ))
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucune réclamation</div>
        ) : (
          complaints.map(c => (
            <div key={c.id} className="card p-5 animate-slideUp">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{c.subject_name}</h3>
                  <p className="text-sm text-gray-500">{c.student_name} - {c.grade_type === 'cc' ? 'Contrôle continu' : c.grade_type === 'ds' ? 'Devoir surveillé' : 'Examen'}: {c.grade_value}</p>
                </div>
                {statusBadge(c.status)}
              </div>
              <p className="text-sm text-gray-600 mb-3">{c.description}</p>
              {c.admin_response && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Réponse: </span>{c.admin_response}
                </div>
              )}
              {user?.role === 'admin' && c.status === 'pending' && (
                <div className="mt-4 space-y-3">
                  {responding === c.id ? (
                    <>
                      <textarea value={adminResponse} onChange={e => setAdminResponse(e.target.value)}
                        className="input-field" rows={2} placeholder="Votre réponse..." />
                      <div className="flex gap-2">
                        <button onClick={() => respondToComplaint(c.id)} className="btn-primary text-sm">Répondre</button>
                        <button onClick={() => setResponding(null)} className="btn-secondary text-sm">Annuler</button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => setResponding(c.id)} className="btn-primary text-sm">Répondre</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
