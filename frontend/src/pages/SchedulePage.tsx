import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAY_EN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const COLORS = ['from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-violet-500 to-purple-500', 'from-indigo-500 to-blue-500']

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export default function SchedulePage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ day: '', start_time: '', end_time: '', room: '', subject_id: '', teacher_id: '' })
  const [editId, setEditId] = useState<number | null>(null)

  const isAdmin = user?.role === 'admin'
  const isStudent = user?.role === 'student'
  const isTeacher = user?.role === 'teacher'

  const loadSchedules = async (classId?: string, teacherId?: string) => {
    try {
      let url = '/schedules/'
      if (classId) url += `?class_id=${classId}`
      else if (teacherId) url += `?teacher_id=${teacherId}`
      const res = await api.get(url)
      setSchedules(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch { setSchedules([]) }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        if (isAdmin) {
          const [clsRes, asgRes] = await Promise.all([
            api.get('/classes/'),
            api.get('/subjects/assignments/'),
          ])
          setClasses(Array.isArray(clsRes.data) ? clsRes.data : clsRes.data.results || [])
          setAssignments(Array.isArray(asgRes.data) ? asgRes.data : asgRes.data.results || [])
          await loadSchedules()
        } else if (isStudent) {
          const enrRes = await api.get('/classes/enrollments/')
          const enrollments = Array.isArray(enrRes.data) ? enrRes.data : enrRes.data.results || []
          const myEnr = enrollments.find((e: any) => e.student_external_id === user?.id)
          if (myEnr) await loadSchedules(String(myEnr.classe))
        } else if (isTeacher) {
          await loadSchedules(undefined, String(user?.id))
        }
      } catch {} finally { setLoading(false) }
    }
    init()
  }, [user])

  const filteredSchedules = isAdmin && selectedClassId
    ? schedules.filter(s => String(s.class_external_id) === selectedClassId)
    : schedules

  const byDay = DAY_EN.map((dayEn) =>
    [...filteredSchedules]
      .filter(s => s.day_of_week === dayEn)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
  )

  const classAssignments = selectedClassId
    ? assignments.filter(a => String(a.class_external_id) === selectedClassId)
    : []

  const selectedClass = classes.find(c => String(c.id) === selectedClassId)

  const resetForm = () => {
    setForm({ day: '', start_time: '', end_time: '', room: '', subject_id: '', teacher_id: '' })
    setEditId(null)
    setShowForm(false)
  }

  const handleEdit = (s: any) => {
    setForm({
      day: s.day_of_week,
      start_time: s.start_time?.slice(0, 5) || '',
      end_time: s.end_time?.slice(0, 5) || '',
      room: s.room || '',
      subject_id: String(s.subject_external_id),
      teacher_id: String(s.teacher_external_id),
    })
    setEditId(s.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette séance ?')) return
    try {
      await api.delete(`/schedules/${id}/`)
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.day || !form.start_time || !form.end_time || !selectedClassId || !form.subject_id) return
    const asg = classAssignments.find(a => String(a.subject) === form.subject_id && (!form.teacher_id || String(a.teacher_external_id) === form.teacher_id))
    const body = {
      class_external_id: parseInt(selectedClassId),
      class_name: selectedClass?.name || '',
      subject_external_id: parseInt(form.subject_id),
      subject_name: asg?.subject_name || '',
      teacher_external_id: parseInt(form.teacher_id || asg?.teacher_external_id),
      teacher_name: asg?.teacher_name || '',
      day_of_week: form.day,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room,
    }
    try {
      if (editId) {
        await api.put(`/schedules/${editId}/`, body)
      } else {
        await api.post('/schedules/', body)
      }
      resetForm()
      await loadSchedules(selectedClassId)
    } catch {}
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse"><div className="h-4 w-32 bg-gray-200 rounded mb-4" /><div className="h-20 bg-gray-100 rounded" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Emploi du temps</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'Gérez les emplois du temps des classes' : isTeacher ? 'Consultez vos séances' : 'Consultez votre emploi du temps'}
          </p>
        </div>
        {isAdmin && selectedClassId && (
          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setShowForm(!showForm) }}
              className="btn-primary text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {showForm ? 'Fermer' : 'Nouvelle séance'}
            </button>
            <button onClick={() => setSelectedClassId('')} className="btn-secondary text-sm">
              Changer classe
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-cyan-50 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Sélectionner une classe</h3>
                  <p className="text-xs text-gray-500">Choisissez la classe pour gérer son emploi du temps</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Classe</label>
                  <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setShowForm(false) }}
                    className="input w-full appearance-none">
                    <option value="">Toutes les classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {selectedClassId && (
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Matières assignées</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[...new Set(classAssignments.map(a => a.subject_name))].map(sn => (
                          <span key={sn} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {sn}
                          </span>
                        ))}
                        {classAssignments.length === 0 && (
                          <span className="text-xs text-gray-400">Aucune matière</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedClassId && (
            <>
              <div className="card overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-cyan-50 border-b border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {selectedClass?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedClass?.name}</h3>
                      <p className="text-xs text-gray-500">{byDay.flat().length} séance{byDay.flat().length > 1 ? 's' : ''} au total</p>
                    </div>
                  </div>
                  <button onClick={() => { resetForm(); setShowForm(!showForm) }}
                    className="btn-primary text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {showForm ? 'Fermer' : 'Ajouter une séance'}
                  </button>
                </div>

                {showForm && (
                  <div className="p-5 bg-gradient-to-b from-indigo-50/50 to-white border-b border-gray-100 animate-slideUp">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow">
                        {editId ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                      </div>
                      <h4 className="font-semibold text-gray-800">{editId ? 'Modifier la séance' : 'Nouvelle séance'}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Jour
                          </span>
                        </label>
                        <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))} className="input w-full appearance-none">
                          <option value="">Choisir</option>
                          {DAY_EN.map((d, i) => <option key={d} value={d}>{DAYS[i]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Début
                          </span>
                        </label>
                        <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} className="input w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Fin
                          </span>
                        </label>
                        <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} className="input w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            Salle
                          </span>
                        </label>
                        <input placeholder="ex: 101" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} className="input w-full" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Matière</label>
                        <select value={form.subject_id} onChange={e => { const subId = e.target.value; setForm(p => ({ ...p, subject_id: subId, teacher_id: '' })) }} className="input w-full appearance-none">
                          <option value="">Choisir</option>
                          {classAssignments.map(a => (
                            <option key={a.subject} value={a.subject}>{a.subject_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Enseignant</label>
                        <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))} className="input w-full appearance-none">
                          <option value="">Sélectionner</option>
                          {classAssignments.filter(a => String(a.subject) === form.subject_id).map(a => (
                            <option key={a.teacher_external_id} value={a.teacher_external_id}>{a.teacher_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-5 mt-4 border-t border-gray-100">
                      <button onClick={handleSubmit} disabled={!form.day || !form.start_time || !form.end_time || !form.subject_id}
                        className="btn-primary text-sm flex items-center gap-2 shadow-lg shadow-indigo-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editId ? 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' : 'M5 13l4 4L19 7'} />
                        </svg>
                        {editId ? 'Enregistrer les modifications' : 'Créer la séance'}
                      </button>
                      <button onClick={resetForm} className="btn-secondary text-sm">Annuler</button>
                      {editId && (
                        <button onClick={() => handleDelete(editId)} className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 ml-auto">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {DAYS.map((day, i) => {
                      const entries = byDay[i]
                      return (
                        <div key={day} className="rounded-xl border border-gray-200 overflow-hidden">
                          <div className={`bg-gradient-to-r ${COLORS[i % COLORS.length]} px-4 py-2.5`}>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-white text-sm">{day}</h3>
                              <span className="text-white/70 text-xs font-medium">{entries.length}</span>
                            </div>
                          </div>
                          <div className="p-3 space-y-2 min-h-[100px]">
                            {entries.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">Aucune séance</p>
                            ) : entries.map(s => (
                              <div key={s.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100 group">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{s.subject_name}</p>
                                    <p className="text-xs text-gray-500">{s.teacher_name}</p>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                                      <span className="inline-flex items-center gap-0.5">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                                      </span>
                                      {s.room && (
                                        <span className="inline-flex items-center gap-0.5">
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                          {s.room}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(s)}
                                      className="p-1.5 rounded-lg bg-white shadow-sm text-gray-400 hover:text-indigo-600 transition-colors border border-gray-200">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(s.id)}
                                      className="p-1.5 rounded-lg bg-white shadow-sm text-gray-400 hover:text-red-600 transition-colors border border-gray-200">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {DAYS.map((day, i) => {
            const entries = byDay[i]
            return (
              <div key={day} className="card overflow-hidden animate-slideUp" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`bg-gradient-to-r ${COLORS[i % COLORS.length]} px-5 py-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{day}</h3>
                    <span className="text-white/70 text-xs font-medium">{entries.length} séance{entries.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3 min-h-[100px]">
                  {entries.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Aucun cours</p>
                  ) : entries.map(s => (
                    <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                      <div className="w-16 shrink-0 text-center py-1">
                        <p className="text-xs font-bold text-indigo-600">{s.start_time?.slice(0, 5)}</p>
                        <p className="text-[10px] text-gray-400">{s.end_time?.slice(0, 5)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.subject_name || 'Cours'}</p>
                        {isStudent && (
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {s.teacher_name}
                          </p>
                        )}
                        {isTeacher && (
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            {s.class_name}
                          </p>
                        )}
                        {s.room && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            {s.room}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}