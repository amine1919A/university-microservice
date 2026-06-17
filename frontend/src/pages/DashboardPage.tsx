import { useAuthStore } from '../store/authStore'
import { useState, useEffect } from 'react'
import api from '../services/api'

interface Stat {
  label: string
  value: string | number
  icon: string
  color: string
  bg: string
}

const adminStats: Stat[] = [
  { label: 'Étudiants', value: '—', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'from-violet-500 to-indigo-600', bg: 'bg-violet-50' },
  { label: 'Enseignants', value: '—', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { label: 'Classes', value: '—', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  { label: 'Matières', value: '—', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
]

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  return (
    <div className={`card p-5 animate-slideUp stagger-${index + 1}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
          <svg className={`w-6 h-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [statsData, setStatsData] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [enrollmentsByClass, setEnrollmentsByClass] = useState<Record<number, any[]>>({})
  const [subjectsCount, setSubjectsCount] = useState<number>(0)
  const [enrollmentsCount, setEnrollmentsCount] = useState<number>(0)
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([])

  const roleLabels: Record<string, string> = {
    admin: "Vous êtes connecté en tant qu'Administrateur. Gérez les utilisateurs, classes, matières, emplois du temps, facturation et répondez aux réclamations.",
    teacher: "Vous êtes connecté en tant qu'Enseignant. Sélectionnez une classe ci-dessous pour saisir les notes, consulter l'emploi du temps, envoyer des messages ou démarrer un live.",
    student: "Vous êtes connecté en tant qu'Étudiant. Consultez vos notes, votre emploi du temps, vos factures et communiquez avec vos enseignants.",
  }

  useEffect(() => {
    const base = user?.role === 'admin' ? adminStats : []
    const results = [...base]

    const fetchStats = async () => {
      try {
        if (user?.role === 'admin') {
          const [students, teachers, classes_] = await Promise.all([
            api.get('/users/students/').catch(() => null),
            api.get('/users/teachers/').catch(() => null),
            api.get('/classes/').catch(() => null),
          ])
          results[0].value = students?.data?.count ?? '—'
          results[1].value = teachers?.data?.count ?? '—'
          const cCount = classes_?.data?.count ?? (Array.isArray(classes_?.data?.results) ? classes_.data.results.length : '—')
          results[2].value = cCount
          if (cCount !== '—') results[3].value = 3
        } else if (user?.role === 'teacher') {
          const [classes_, assignments] = await Promise.all([
            api.get('/classes/').catch(() => null),
            api.get('/subjects/assignments/').catch(() => null),
          ])
          const allClasses = classes_?.data?.results || classes_?.data || []
          const allAssignments = assignments?.data?.results || assignments?.data || []
          const myAssignments = allAssignments.filter((a: any) => a.teacher_external_id === user?.id)
          const classIds = [...new Set(myAssignments.map((a: any) => Number(a.class_external_id)))]
          const filteredClasses = allClasses.filter((c: any) => classIds.includes(c.id))
          setTeacherClasses(filteredClasses)
          setTeacherAssignments(myAssignments)
          setSubjectsCount(new Set(myAssignments.map((a: any) => a.subject)).size)
          const enrMap: Record<number, any[]> = {}
          let totalEnr = 0
          for (const cid of classIds as number[]) {
            try {
              const enrRes = await api.get(`/classes/enrollments/?classe_id=${cid}`)
              const enrData = Array.isArray(enrRes.data) ? enrRes.data : enrRes.data.results || []
              enrMap[cid] = enrData
              totalEnr += enrData.length
            } catch { enrMap[cid] = [] }
          }
          setEnrollmentsByClass(enrMap)
          setEnrollmentsCount(totalEnr)
        } else if (user?.role === 'student') {
          const [enrollments, gradesData] = await Promise.all([
            api.get('/classes/enrollments/').catch(() => null),
            api.get(`/grades/?student_id=${user.id}`).catch(() => null),
          ])
          const allEnrollments = enrollments?.data?.results || enrollments?.data || []
          const myEnrollment = allEnrollments.find((e: any) => e.student_external_id === user?.id)
          if (myEnrollment) {
            const [classData, assignments] = await Promise.all([
              api.get(`/classes/${myEnrollment.classe}/`).catch(() => null),
              api.get('/subjects/assignments/').catch(() => null),
            ])
            const allAssignments = assignments?.data?.results || assignments?.data || []
            const classAssignments = allAssignments.filter((a: any) => a.class_external_id === myEnrollment.classe)
            setStudentInfo({
              class: classData?.data || { name: 'Classe #' + myEnrollment.classe },
              assignments: classAssignments,
              grades: gradesData?.data?.results || gradesData?.data || [],
            })
          }
        }
      } catch {} finally {
        setStatsData(results)
        setLoading(false)
      }
    }
    fetchStats()
  }, [user])

  if (user?.role === 'teacher') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between animate-fadeIn">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Bon retour, {user?.first_name || user?.username}</h1>
            <p className="mt-1 text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <a href="/notes" className="btn-primary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Saisir des notes
          </a>
        </div>

        <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <p className="text-gray-700 leading-relaxed flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {roleLabels.teacher}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card p-5 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Mes classes</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{teacherClasses.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="card p-5 animate-slideUp stagger-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Étudiants</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{enrollmentsCount || '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="card p-5 animate-slideUp stagger-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Matières</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{subjectsCount || '—'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Mes classes</h3>
            <span className="text-sm text-gray-400">{teacherClasses.length} classe{teacherClasses.length > 1 ? 's' : ''}</span>
          </div>
          {teacherClasses.length === 0 ? (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-400 font-medium">Aucune classe assignée</p>
              <p className="text-sm text-gray-300 mt-1">Les classes apparaîtront ici une fois assignées par l'administration.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {teacherClasses.map((c: any, i: number) => {
                const classEnrollments = enrollmentsByClass?.[c.id] || []
                const classSubjects = teacherAssignments.filter((a: any) => String(a.class_external_id) === String(c.id))
                return (
                  <div key={c.id} className="card p-5 animate-slideUp" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                        {c.name?.[0] || 'C'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{c.name}</h3>
                        <p className="text-xs text-gray-400">{classEnrollments.length} étudiant{classEnrollments.length > 1 ? 's' : ''} · {classSubjects.length} matière{classSubjects.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <a href={`/notes?class_id=${c.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Notes
                      </a>
                      <a href="/messages" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        Messages
                      </a>
                      <a href="/live" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Live
                      </a>
                      <a href="/emploi" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Emploi
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (user?.role === 'student') {
    const gradeCount = studentInfo?.grades?.length || 0
    const subjectCount = studentInfo?.assignments?.length || 0
    const allGrades = studentInfo?.grades || []
    const avg = allGrades.length > 0 ? (allGrades.reduce((s: number, g: any) => s + Number(g.grade), 0) / allGrades.length).toFixed(1) : null
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between animate-fadeIn">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Bon retour, {user?.first_name || user?.username}</h1>
            <p className="mt-1 text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {studentInfo && (
            <a href="/mes-notes" className="btn-primary text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Voir mes notes
            </a>
          )}
        </div>

        {studentInfo ? (
          <>
            <div className="card p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              <p className="text-gray-700 leading-relaxed flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {roleLabels.student}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card p-5 animate-slideUp">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Ma classe</p>
                    <p className="text-lg font-bold text-gray-800 mt-1 truncate">{studentInfo.class.name}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="card p-5 animate-slideUp stagger-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Matières</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{subjectCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="card p-5 animate-slideUp stagger-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Moyenne générale</p>
                    <p className={`text-3xl font-bold mt-1 ${avg ? (Number(avg) >= 10 ? 'text-emerald-600' : 'text-red-600') : 'text-gray-800'}`}>
                      {avg ? `${avg}/20` : '—'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Mes matières</h3>
                <span className="text-sm text-gray-400">{subjectCount} matière{subjectCount > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {studentInfo.assignments.map((a: any, i: number) => {
                  const subjGrades = allGrades.filter((g: any) => g.subject_external_id === a.subject)
                  const subjAvg = subjGrades.length > 0 ? (subjGrades.reduce((s: number, g: any) => s + Number(g.grade), 0) / subjGrades.length).toFixed(1) : null
                  return (
                    <div key={i} className="card p-5 animate-slideUp" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                          {a.subject_name?.[0] || 'M'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{a.subject_name}</h4>
                          <p className="text-xs text-gray-400 truncate">{a.teacher_name}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        {subjAvg && (
                          <span className={`text-sm font-bold ${Number(subjAvg) >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {subjAvg}/20
                          </span>
                        )}
                        <div className="flex gap-1.5 ml-auto">
                          <a href={`/profile/${a.teacher_external_id}`} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Profil
                          </a>
                          <a href={`/reclamations?subject_id=${a.subject}&teacher_id=${a.teacher_external_id}`} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                            Réclamer
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {gradeCount > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Mes notes récentes
                  </h3>
                  <span className="text-xs text-gray-400">{gradeCount} note{gradeCount > 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Matière</th>
                      <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Note</th>
                    </tr></thead>
                    <tbody>
                      {allGrades.slice(0, 10).map((g: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-sm text-gray-800">{g.subject_name}</td>
                          <td className="p-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${g.grade_type === 'cc' ? 'bg-blue-50 text-blue-700' : g.grade_type === 'ds' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}`}>
                              {g.grade_type === 'cc' ? 'CC' : g.grade_type === 'ds' ? 'DS' : 'Examen'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`text-sm font-bold ${Number(g.grade) >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {g.grade}/20
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {gradeCount > 10 && (
                  <div className="p-3 text-center border-t border-gray-100">
                    <a href="/mes-notes" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Voir toutes les notes ({gradeCount})</a>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-400 font-medium">En attente d'affectation</p>
            <p className="text-sm text-gray-300 mt-1">Vous serez affecté à une classe par l'administration.</p>
          </div>
        )}
      </div>
    )
  }

  if (!statsData.length && loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5"><div className="animate-pulse space-y-3"><div className="h-4 w-20 bg-gray-200 rounded" /><div className="h-8 w-16 bg-gray-200 rounded" /></div></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fadeIn">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Bon retour, {user?.first_name || user?.username}</h1>
          <p className="mt-1 text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <a href="/users" className="btn-primary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Ajouter
          </a>
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100">
        <p className="text-gray-700 leading-relaxed flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {roleLabels.admin}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(statsData.length ? statsData : adminStats).map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden animate-slideUp stagger-5">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Actions rapides</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="/classes" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 border border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Gérer les classes</p>
                  <p className="text-xs text-gray-500">Créer, modifier, ajouter des étudiants</p>
                </div>
              </a>
              <a href="/users" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 border border-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Gérer les utilisateurs</p>
                  <p className="text-xs text-gray-500">Ajouter, modifier, désactiver</p>
                </div>
              </a>
              <a href="/emploi" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all duration-200 border border-amber-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Emploi du temps</p>
                  <p className="text-xs text-gray-500">Planifier les séances</p>
                </div>
              </a>
              <a href="/reclamations" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-all duration-200 border border-rose-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Réclamations</p>
                  <p className="text-xs text-gray-500">Traiter les réclamations</p>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="card p-6 animate-slideUp stagger-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Plateforme opérationnelle</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Année universitaire 2025/2026</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

