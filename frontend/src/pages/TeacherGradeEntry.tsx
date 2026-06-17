import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function TeacherGradeEntry() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [existingGrades, setExistingGrades] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user?.id) return
    api.get(`/subjects/assignments/?teacher_external_id=${user.id}`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data.results || []
      setAssignments(data)
    }).catch(() => {})
  }, [user?.id])

  const currentAssignment = assignments.find((a: any) => String(a.class_external_id) === selectedClass)
  const subjectId = currentAssignment?.subject || ''
  const subjectName = currentAssignment?.subject_name || ''

  useEffect(() => {
    if (!selectedClass) { setEnrollments([]); return }
    api.get(`/classes/enrollments/?classe_id=${selectedClass}`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data.results || []
      setEnrollments(data)
    }).catch(() => setEnrollments([]))
  }, [selectedClass])

  useEffect(() => {
    if (!selectedClass || !subjectId || !user?.id) { setExistingGrades([]); return }
    api.get(`/grades/by-class/${selectedClass}/?subject_id=${subjectId}&teacher_id=${user.id}`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : []
      setExistingGrades(data)
    }).catch(() => setExistingGrades([]))
  }, [selectedClass, subjectId, user?.id])

  useEffect(() => {
    const g: Record<string, Record<string, string>> = {}
    enrollments.forEach((e: any) => {
      g[e.student_external_id] = { cc: '', ds: '', examen: '' }
    })
    existingGrades.forEach((eg: any) => {
      const sid = eg.student_external_id
      if (g[sid]) {
        g[sid][eg.grade_type] = String(eg.grade)
      }
    })
    setGrades(g)
  }, [enrollments, existingGrades])

  const classList = [...new Set(assignments.map((a: any) => a.class_external_id))].map(id => {
    const a = assignments.find((x: any) => x.class_external_id === id)
    return { id, name: a?.class_name || `Classe #${id}` }
  })

  const handleGradeChange = (studentId: number, type: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [type]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const payload: any[] = []

    Object.entries(grades).forEach(([sid, types]) => {
      const student = enrollments.find((e: any) => String(e.student_external_id) === sid)
      ;['cc', 'ds', 'examen'].forEach((gt) => {
        const val = (types as any)[gt]
        if (val && !isNaN(parseFloat(val))) {
          payload.push({
            student_external_id: parseInt(sid),
            student_name: student?.student_name || '',
            subject_external_id: parseInt(subjectId),
            subject_name: subjectName,
            class_external_id: parseInt(selectedClass),
            teacher_external_id: user!.id,
            teacher_name: `${user!.first_name} ${user!.last_name}`,
            grade_type: gt,
            semester: 's1',
            grade: parseFloat(val),
          })
        }
      })
    })

    if (payload.length === 0) {
      setMessage('Aucune note à enregistrer')
      setSaving(false)
      return
    }

    try {
      const res = await api.post('/grades/bulk/', payload)
      const data = res.data
      setMessage(`${data.created?.length || 0} notes enregistrées${data.errors?.length ? `, ${data.errors.length} erreurs` : ''}`)
      const updated = await api.get(`/grades/by-class/${selectedClass}/?subject_id=${subjectId}&teacher_id=${user!.id}`)
      setExistingGrades(Array.isArray(updated.data) ? updated.data : [])
    } catch {
      setMessage("Erreur lors de l'enregistrement")
    }
    setSaving(false)
  }

  const getStudentAverage = (studentId: string): string => {
    const g = grades[studentId]
    if (!g) return '-'
    const values = [g.cc, g.ds, g.examen].filter(v => v && !isNaN(parseFloat(v))).map(Number)
    if (values.length === 0) return '-'
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  }

  const totalCells = enrollments.length * 3
  const filledCells = Object.values(grades).reduce((acc, g) => {
    return acc + [g.cc, g.ds, g.examen].filter(v => v !== '').length
  }, 0)
  const completionPct = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Saisie des notes</h1>
          <p className="text-sm text-gray-500 mt-1">Sélectionnez une classe pour saisir les notes</p>
        </div>
        {selectedClass && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow">
              {subjectName?.[0] || 'M'}
            </div>
            <span className="text-sm font-medium text-gray-700">{subjectName}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Classe</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
            className="input w-full appearance-none">
            <option value="">Sélectionner une classe</option>
            {classList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && !enrollments.length && (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-400 font-medium">Aucun étudiant dans cette classe</p>
        </div>
      )}

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={message.includes('Erreur') ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
          {message}
        </div>
      )}

      {selectedClass && enrollments.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Étudiants</p>
                <p className="text-lg font-bold text-gray-800">{enrollments.length}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Notes saisies</p>
                <p className="text-lg font-bold text-gray-800">{filledCells}/{totalCells}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-500">Progression</p>
                  <span className="text-xs font-bold text-gray-700">{completionPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {subjectName?.[0] || 'M'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{subjectName}</h3>
                  <p className="text-xs text-gray-500">{enrollments.length} étudiants · {completionPct}% complété</p>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary text-sm flex items-center gap-2">
                {saving ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Enregistrement...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Enregistrer
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">Étudiant</th>
                    <th className="text-center px-3 py-3 text-sm font-semibold text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        CC
                      </span>
                    </th>
                    <th className="text-center px-3 py-3 text-sm font-semibold text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        DS
                      </span>
                    </th>
                    <th className="text-center px-3 py-3 text-sm font-semibold text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        Examen
                      </span>
                    </th>
                    <th className="text-center px-3 py-3 text-sm font-semibold text-gray-500">Moy.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enrollments.map((enr: any) => {
                    const avg = getStudentAverage(enr.student_external_id)
                    return (
                      <tr key={enr.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-xs">
                              {enr.student_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{enr.student_name}</span>
                          </div>
                        </td>
                        {(['cc', 'ds', 'examen'] as const).map((gt) => {
                          const val = grades[enr.student_external_id]?.[gt] || ''
                          return (
                            <td key={gt} className="px-2 py-3 text-center">
                              <input type="number" min="0" max="20" step="0.5" placeholder="--"
                                value={val}
                                onChange={(e) => handleGradeChange(enr.student_external_id, gt, e.target.value)}
                                className={`w-20 text-center input text-sm py-1.5 mx-auto transition-all
                                  ${val ? (Number(val) >= 10 ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50') : 'border-gray-200 bg-white'}
                                  focus:ring-2 focus:ring-indigo-300`}
                              />
                            </td>
                          )
                        })}
                        <td className="text-center px-3 py-3">
                          <span className={`text-sm font-bold ${avg !== '-' ? (Number(avg) >= 10 ? 'text-emerald-600' : 'text-red-600') : 'text-gray-300'}`}>
                            {avg !== '-' ? `${avg}/20` : '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-2">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> CC</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> DS</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Examen</span>
                · Notes sur 20
              </span>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}