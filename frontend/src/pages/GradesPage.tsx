import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function GradesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = selectedSubject ? `?student_id=${user?.id}&subject_id=${selectedSubject}` : `?student_id=${user?.id}`
    api.get(`/grades/${params}`).then((res) => {
      setGrades(Array.isArray(res.data) ? res.data : res.data.results || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedSubject, user?.id])

  useEffect(() => {
    api.get('/subjects/').then((res) => {
      setSubjects(Array.isArray(res.data) ? res.data : res.data.results || [])
    }).catch(() => {})
  }, [])

  const groupedBySubject: Record<string, any[]> = {}
  grades.forEach(g => {
    const key = g.subject_name || 'Autre'
    if (!groupedBySubject[key]) groupedBySubject[key] = []
    groupedBySubject[key].push(g)
  })

  const gradeTypeLabels: Record<string, string> = {
    cc: 'Contrôle continu',
    ds: 'Devoir surveillé',
    examen: 'Examen',
  }

  const gradeTypeColors: Record<string, string> = {
    cc: 'bg-blue-50 text-blue-700',
    ds: 'bg-amber-50 text-amber-700',
    examen: 'bg-purple-50 text-purple-700',
  }

  const calcAverage = (subjectGrades: any[]) => {
    if (subjectGrades.length === 0) return 0
    const sum = subjectGrades.reduce((acc, g) => acc + Number(g.grade), 0)
    return (sum / subjectGrades.length).toFixed(1)
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes notes</h1>
          <p className="text-sm text-gray-500 mt-1">Consultez vos résultats par matière</p>
        </div>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
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
          {Object.entries(groupedBySubject).map(([subjectName, subjectGrades]) => {
            const avg = calcAverage(subjectGrades)
            return (
              <div key={subjectName} className="card overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{subjectName}</h3>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${Number(avg) >= 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={Number(avg) >= 10 ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                      </svg>
                      {avg}/20
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {subjectGrades.map((g: any) => (
                    <div key={g.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${gradeTypeColors[g.grade_type] || 'bg-gray-50 text-gray-600'}`}>
                          {gradeTypeLabels[g.grade_type] || g.grade_type}
                        </span>
                        <span className="text-xs text-gray-400">{g.semester === 's1' ? 'S1' : 'S2'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${Number(g.grade) >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {g.grade}/20
                        </span>
                        <button onClick={() => navigate(`/reclamations?subject_id=${g.subject_external_id}&grade_type=${g.grade_type}&grade_value=${g.grade}`)}
                          className="text-xs text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors">
                          Réclamer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {subjectGrades.length > 0 && (
                  <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>{subjectGrades.length} note{subjectGrades.length > 1 ? 's' : ''}</span>
                    <span className="font-medium">Moyenne: <span className={Number(avg) >= 10 ? 'text-emerald-600' : 'text-red-600'}>{avg}/20</span></span>
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