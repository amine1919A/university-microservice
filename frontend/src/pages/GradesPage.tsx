import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function GradesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/grades/?student_id=${user?.id}`).then((res) => {
      setGrades(Array.isArray(res.data) ? res.data : res.data.results || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user?.id])

  const groupedBySubject: Record<string, any[]> = {}
  grades.forEach(g => {
    const key = `${g.subject_name}__${g.teacher_external_id}`
    if (!groupedBySubject[key]) groupedBySubject[key] = []
    groupedBySubject[key].push(g)
  })

  const gradeTypeLabels: Record<string, string> = {
    cc: 'CC',
    ds: 'DS',
    examen: 'Examen',
  }

  const gradeTypeColors: Record<string, string> = {
    cc: 'bg-blue-500',
    ds: 'bg-amber-500',
    examen: 'bg-purple-500',
  }

  const getNote = (subjectGrades: any[], type: string) => {
    const g = subjectGrades.find(x => x.grade_type === type)
    return g ? { grade: Number(g.grade), id: g.id } : null
  }

  const allThreePresent = (subjectGrades: any[]) => {
    return ['cc', 'ds', 'examen'].every(t => subjectGrades.some(x => x.grade_type === t))
  }

  const calcSubjectAverage = (subjectGrades: any[]) => {
    const sum = subjectGrades.reduce((acc, g) => acc + Number(g.grade), 0)
    return (sum / subjectGrades.length).toFixed(1)
  }

  const subjectGradientColors = [
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-purple-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-blue-500',
  ]

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes notes</h1>
          <p className="text-sm text-gray-500 mt-1">Consultez vos résultats par matière</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => <div key={j} className="h-10 bg-gray-100 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className="card p-16 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p className="text-gray-400 font-medium">Aucune note pour le moment</p>
          <p className="text-sm text-gray-300 mt-1">Les notes apparaîtront ici une fois saisies par vos enseignants</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedBySubject).map(([key, subjectGrades], idx) => {
            const cc = getNote(subjectGrades, 'cc')
            const ds = getNote(subjectGrades, 'ds')
            const examen = getNote(subjectGrades, 'examen')
            const complete = allThreePresent(subjectGrades)
            const avg = complete ? calcSubjectAverage(subjectGrades) : null
            const teacherName = subjectGrades[0]?.teacher_name || ''
            const subjectName = subjectGrades[0]?.subject_name || key.split('__')[0]
            const gradient = subjectGradientColors[idx % subjectGradientColors.length]

            return (
              <div key={key} className="card overflow-hidden transition-all hover:shadow-lg">
                <div className={`bg-gradient-to-r ${gradient} px-5 py-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">{subjectName}</h3>
                      <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {teacherName}
                      </p>
                    </div>
                    {complete ? (
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${Number(avg) >= 10 ? 'bg-white/90 text-emerald-700' : 'bg-white/90 text-red-700'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={Number(avg) >= 10 ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                        </svg>
                        {avg}/20
                      </div>
                    ) : (
                      <span className="text-white/60 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">
                        En attente
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4">
                    {(['cc', 'ds', 'examen'] as const).map((type) => {
                      const note = type === 'cc' ? cc : type === 'ds' ? ds : examen
                      return (
                        <div key={type} className={`rounded-xl border ${note ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50'} p-4 text-center transition-all`}>
                          <div className="flex items-center justify-center gap-1.5 mb-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${gradeTypeColors[type]}`} />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{gradeTypeLabels[type]}</span>
                          </div>
                          {note ? (
                            <span className={`text-2xl font-bold ${note.grade >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {note.grade.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-lg text-gray-300 font-medium">---</span>
                          )}
                          {note && (
                            <div className="mt-1">
                              <span className="text-[10px] text-gray-400">/20</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {complete && (
                  <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Moyenne {subjectName}</span>
                    <span className={`text-sm font-bold ${Number(avg) >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {avg}/20
                    </span>
                  </div>
                )}

                {subjectGrades.some(g => g.grade_type === 'cc' || g.grade_type === 'ds' || g.grade_type === 'examen') && (
                  <div className="px-5 py-2.5 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <button onClick={() => {
                      const grade = subjectGrades[0]
                      navigate(`/reclamations?subject_id=${grade.subject_external_id}&teacher_id=${grade.teacher_external_id}`)
                    }} className="text-xs text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l4-4M9 17l6-6m-5.5 5.5l7-7M17 3l4 4-7 7-4-4 7-7z" />
                      </svg>
                      Réclamer
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
