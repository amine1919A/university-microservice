import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function ClassesPage() {
  const { user } = useAuthStore()
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', capacity: '35' })
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [classAssignments, setClassAssignments] = useState<any[]>([])
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [createError, setCreateError] = useState('')
  const [subjectTeacherMap, setSubjectTeacherMap] = useState<Record<number, number>>({})

  const isAdmin = user?.role === 'admin'

  const loadClasses = () => {
    api.get('/classes/').then((res) => {
      const d = Array.isArray(res.data) ? res.data : res.data.results || []
      setClasses(d)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const loadUnassignedStudents = () => {
    api.get('/users/unassigned-students/').then((res) => {
      setUnassignedStudents(Array.isArray(res.data) ? res.data : res.data.results || [])
    }).catch(() => setUnassignedStudents([]))
  }

  useEffect(() => { loadClasses() }, [])

  useEffect(() => {
    if (!showCreate) { setStep(1); return }
    Promise.all([
      loadUnassignedStudents(),
      api.get('/subjects/'),
      api.get('/users/teachers/'),
    ]).then(([, subr, tr]) => {
      setSubjects(Array.isArray(subr.data) ? subr.data : subr.data.results || [])
      setTeachers(Array.isArray(tr.data) ? tr.data : tr.data.results || [])
    }).catch(() => {})
  }, [showCreate])

  useEffect(() => {
    if (!selectedClass) { setEnrollments([]); setClassAssignments([]); return }
    Promise.all([
      api.get(`/classes/enrollments/?classe_id=${selectedClass.id}`),
      api.get('/subjects/assignments/'),
      api.get('/subjects/'),
      api.get('/users/teachers/'),
      loadUnassignedStudents(),
    ]).then(([er, ar, sr, tr]) => {
      setEnrollments(Array.isArray(er.data) ? er.data : er.data.results || [])
      const all = Array.isArray(ar.data) ? ar.data : ar.data.results || []
      setClassAssignments(all.filter((a: any) => a.class_external_id === selectedClass.id))
      setSubjects(Array.isArray(sr.data) ? sr.data : sr.data.results || [])
      setTeachers(Array.isArray(tr.data) ? tr.data : tr.data.results || [])
    }).catch(() => {})
  }, [selectedClass])

  const getTeachersForSubject = (subjectId: number) => {
    const sub = subjects.find(s => s.id === subjectId)
    if (!sub) return []
    return teachers.filter((t: any) =>
      t.specialization?.toLowerCase() === sub.name.toLowerCase()
    )
  }

  const nextStep = () => { setCreateError(''); setStep(s => s + 1) }
  const prevStep = () => { setCreateError(''); setStep(s => s - 1) }

  const createClass = async () => {
    setCreateError('')
    if (!form.name) { setCreateError('Veuillez entrer un nom de classe'); return }
    try {
      const clsRes = await api.post('/classes/', { name: form.name, level: '', capacity: parseInt(form.capacity) })
      const newClass = clsRes.data

      for (const studentId of selectedStudents) {
        const s = unassignedStudents.find((u: any) => (u.external_id || u.id) === studentId)
        await api.post('/classes/enrollments/', {
          student_external_id: studentId,
          student_name: s ? `${s.first_name} ${s.last_name}` : '',
          classe: newClass.id,
        })
      }

      for (const [subjectId, teacherId] of Object.entries(subjectTeacherMap)) {
        const t = teachers.find((te: any) => (te.external_id || te.id) === teacherId)
        await api.post('/subjects/assignments/', {
          subject: parseInt(subjectId),
          teacher_external_id: teacherId,
          teacher_name: t ? `${t.first_name} ${t.last_name}` : '',
          class_external_id: newClass.id,
          class_name: newClass.name,
          hours_per_week: 2,
        })
      }

      setShowCreate(false)
      setStep(1)
      setForm({ name: '', capacity: '35' })
      setSelectedStudents([])
      setSubjectTeacherMap({})
      loadClasses()
      loadUnassignedStudents()
      setSelectedClass(null)
    } catch (err: any) {
      const data = err.response?.data
      setCreateError(data ? Object.values(data).flat().join(', ') : "Erreur lors de la création")
    }
  }

  const deleteClass = async (id: number) => {
    if (!confirm('Supprimer cette classe ?')) return
    try { await api.delete(`/classes/${id}/`); loadClasses(); if (selectedClass?.id === id) setSelectedClass(null) } catch {}
  }

  const assignStudent = async (student: any) => {
    try {
      await api.post('/classes/enrollments/', {
        student_external_id: student.external_id || student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        classe: selectedClass!.id,
      })
      const res = await api.get(`/classes/enrollments/?classe_id=${selectedClass!.id}`)
      setEnrollments(Array.isArray(res.data) ? res.data : res.data.results || [])
      loadUnassignedStudents()
    } catch {}
  }

  const unassignStudent = async (enrollmentId: number) => {
    try {
      await api.delete(`/classes/enrollments/${enrollmentId}/`)
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
      loadUnassignedStudents()
    } catch {}
  }

  const addStudentToClass = (sid: number) => {
    setSelectedStudents(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
  }

  const handleAddSubject = async (subjectId: number, teacherId: number) => {
    if (!selectedClass) return
    const t = teachers.find((te: any) => (te.external_id || te.id) === teacherId)
    try {
      await api.post('/subjects/assignments/', {
        subject: subjectId,
        teacher_external_id: teacherId,
        teacher_name: t ? `${t.first_name} ${t.last_name}` : '',
        class_external_id: selectedClass.id,
        class_name: selectedClass.name,
        hours_per_week: 2,
      })
      const res = await api.get('/subjects/assignments/')
      const all = Array.isArray(res.data) ? res.data : res.data.results || []
      setClassAssignments(all.filter((a: any) => a.class_external_id === selectedClass.id))
    } catch {}
  }

  const removeAssignment = async (assignmentId: number) => {
    try {
      await api.delete(`/subjects/assignments/${assignmentId}/`)
      setClassAssignments(prev => prev.filter(a => a.id !== assignmentId))
    } catch {}
  }

  const toggleSubjectTeacher = (subjectId: number, teacherId: number) => {
    setSubjectTeacherMap(prev => {
      if (prev[subjectId] === teacherId) {
        const n = { ...prev }
        delete n[subjectId]
        return n
      }
      return { ...prev, [subjectId]: teacherId }
    })
  }

  const resetForm = () => {
    setShowCreate(false)
    setStep(1)
    setForm({ name: '', capacity: '35' })
    setSelectedStudents([])
    setSubjectTeacherMap({})
    setCreateError('')
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isAdmin ? 'Gestion des classes' : 'Mes classes'}</h1>
        {isAdmin && <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm py-2.5">+ Nouvelle classe</button>}
      </div>

      {showCreate && isAdmin && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <div className="flex items-center justify-center gap-3 mb-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${step >= s ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
                <span className={`text-sm font-medium ${step >= s ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {s === 1 ? 'Infos' : s === 2 ? 'Étudiants' : 'Matières'}
                </span>
                {s < 3 && <div className={`w-12 h-0.5 mx-1 rounded ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {createError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{createError}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">Informations de la classe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom de la classe</label>
                  <input placeholder="ex: DSI24" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Capacité max</label>
                  <input type="number" placeholder="35" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={nextStep} disabled={!form.name} className="btn-primary">Suivant</button>
                <button onClick={resetForm} className="btn-secondary">Annuler</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">Sélectionner les étudiants</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{unassignedStudents.length} étudiant(s) sans classe</p>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{selectedStudents.length} sélectionné(s)</span>
              </div>
              {unassignedStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="font-medium">Aucun étudiant disponible</p>
                  <p className="text-sm mt-1">Créez d'abord des étudiants dans la page Utilisateurs.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                  {unassignedStudents.map((s: any) => {
                    const sid = s.external_id || s.id
                    const isSelected = selectedStudents.includes(sid)
                    return (
                      <button key={sid} onClick={() => addStudentToClass(sid)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={prevStep} className="btn-secondary">Retour</button>
                <button onClick={nextStep} disabled={selectedStudents.length === 0} className="btn-primary">Suivant ({selectedStudents.length} étudiant{selectedStudents.length > 1 ? 's' : ''})</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">Matières et enseignants</h3>
              <p className="text-sm text-gray-500">Sélectionnez au moins une matière et choisissez l'enseignant correspondant</p>

              {subjects.filter(s => teachers.some((t: any) => t.specialization?.toLowerCase() === s.name.toLowerCase())).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="font-medium">Aucune matière disponible</p>
                  <p className="text-sm mt-1">Les matières sont créées automatiquement à partir des spécialités des enseignants.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                  {subjects.filter(s => teachers.some((t: any) => t.specialization?.toLowerCase() === s.name.toLowerCase())).map(sub => {
                    const subTeachers = getTeachersForSubject(sub.id)
                    const selectedTeacherId = subjectTeacherMap[sub.id]
                    const isSelected = !!selectedTeacherId
                    return (
                      <div key={sub.id} className={`rounded-xl border-2 p-4 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">{sub.name}</p>
                            <p className="text-xs text-gray-400">Coefficient {sub.coefficient}</p>
                          </div>
                          {isSelected && <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">✓</span>}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500 mb-1">Enseignants disponibles :</p>
                          {subTeachers.map((t: any) => {
                            const tid = t.external_id || t.id
                            return (
                              <button key={tid} onClick={() => toggleSubjectTeacher(sub.id, tid)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                  selectedTeacherId === tid ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}>
                                <span className="font-medium">{t.first_name} {t.last_name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-gray-400">{Object.keys(subjectTeacherMap).length} matière(s) avec enseignant</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={prevStep} className="btn-secondary">Retour</button>
                <button onClick={createClass} disabled={Object.keys(subjectTeacherMap).length === 0} className="btn-primary">
                  Créer la classe ({selectedStudents.length} étudiant{selectedStudents.length > 1 ? 's' : ''}, {Object.keys(subjectTeacherMap).length} matière{Object.keys(subjectTeacherMap).length > 1 ? 's' : ''})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          {loading ? [...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse"><div className="h-5 bg-gray-200 rounded w-32 mb-2" /><div className="h-4 bg-gray-100 rounded w-20" /></div>
          )) : classes.length === 0 ? (
            <div className="card p-12 text-center text-gray-400">Aucune classe</div>
          ) : classes.map((c: any) => (
            <div key={c.id} className={`card p-5 cursor-pointer transition-all duration-200 ${selectedClass?.id === c.id ? 'ring-2 ring-indigo-400 shadow-lg' : 'hover:shadow-md'}`}
              onClick={() => setSelectedClass(c)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {c.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.name}</h3>
                    <p className="text-xs text-gray-400">{c.student_count || 0} étudiant{c.student_count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); deleteClass(c.id) }} className="text-xs text-red-500 hover:text-red-700 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedClass && isAdmin && (
          <div className="space-y-4">
            <div className="card p-5 animate-slideUp">
              <h3 className="font-bold text-gray-800 mb-3">{selectedClass.name} — Étudiants ({enrollments.length})</h3>

              <details className="group mb-3">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un étudiant
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded-xl border border-gray-100 p-2">
                  {unassignedStudents.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">Aucun étudiant disponible</p>
                  ) : unassignedStudents.map((s: any) => {
                    const sid = s.external_id || s.id
                    return (
                      <button key={sid} onClick={() => assignStudent(s)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all text-left">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <span className="text-sm text-gray-700">{s.first_name} {s.last_name}</span>
                      </button>
                    )
                  })}
                </div>
              </details>

              {enrollments.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">Aucun étudiant dans cette classe</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {enrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-medium text-gray-700">{e.student_name}</span>
                      <button onClick={() => unassignStudent(e.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Retirer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5 animate-slideUp">
              <h3 className="font-bold text-gray-800 mb-3">Matières — Enseignants ({classAssignments.length})</h3>

              <details className="group mb-3">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter une matière
                </summary>
                <div className="mt-2 space-y-2 rounded-xl border border-gray-100 p-2">
                  {subjects
                    .filter(s => teachers.some((t: any) => t.specialization?.toLowerCase() === s.name.toLowerCase()))
                    .filter(sub => !classAssignments.some(a => Number(a.subject) === sub.id))
                    .length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">Aucune matière disponible</p>
                  ) : subjects
                    .filter(s => teachers.some((t: any) => t.specialization?.toLowerCase() === s.name.toLowerCase()))
                    .filter(sub => !classAssignments.some(a => Number(a.subject) === sub.id))
                    .map(sub => {
                      const subTeachers = getTeachersForSubject(sub.id)
                      return (
                        <div key={sub.id} className="rounded-lg border border-gray-100 p-3">
                          <p className="font-medium text-sm text-gray-800 mb-2">{sub.name}</p>
                          <div className="space-y-1">
                            {subTeachers.map((t: any) => {
                              const tid = t.external_id || t.id
                              return (
                                <button key={tid} onClick={() => handleAddSubject(sub.id, tid)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-all text-left">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                                    {t.first_name?.[0]}{t.last_name?.[0]}
                                  </div>
                                  <span className="font-medium">{t.first_name} {t.last_name}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </details>

              {classAssignments.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">Aucune matière assignée</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {classAssignments.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{a.subject_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{a.teacher_name} · {a.hours_per_week}h/sem</span>
                      </div>
                      <button onClick={() => removeAssignment(a.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Retirer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
