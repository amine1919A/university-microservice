import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/auth/users/${id}/`).then(r => {
      setProfile(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!profile) return (
    <div className="card p-12 text-center text-gray-400">
      <p className="font-medium">Utilisateur introuvable</p>
    </div>
  )

  const roleColors: Record<string, string> = {
    admin: 'from-purple-500 to-indigo-600',
    teacher: 'from-blue-500 to-cyan-500',
    student: 'from-emerald-500 to-teal-500',
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    teacher: 'Enseignant',
    student: 'Étudiant',
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="card p-8">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${roleColors[profile.role] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{profile.first_name} {profile.last_name}</h1>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700`}>
              {roleLabels[profile.role] || profile.role}
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
            <p className="text-sm font-medium text-gray-800">{profile.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Téléphone</label>
            <p className="text-sm font-medium text-gray-800">{profile.phone || '-'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Membre depuis</label>
            <p className="text-sm font-medium text-gray-800">{new Date(profile.date_joined).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${profile.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {profile.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {currentUser?.role === 'admin' && profile.role === 'student' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Classe</h3>
            <ClassesForStudent studentId={profile.id} />
          </div>
        )}

        {currentUser?.role === 'admin' && profile.role === 'teacher' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Spécialité</h3>
            <p className="text-sm text-gray-600">{profile.specialization || 'Aucune spécialité'}</p>
          </div>
        )}
      </div>

      {currentUser && currentUser.id !== profile.id && (
        <button onClick={() => navigate('/messages')}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Envoyer un message
        </button>
      )}
    </div>
  )
}

function ClassesForStudent({ studentId }: { studentId: number }) {
  const [enrollments, setEnrollments] = useState<any[]>([])
  useEffect(() => {
    api.get(`/classes/enrollments/?student_id=${studentId}`).then(r => {
      setEnrollments(Array.isArray(r.data) ? r.data : r.data.results || [])
    }).catch(() => {})
  }, [studentId])

  if (enrollments.length === 0) return <p className="text-sm text-gray-400">Aucune classe</p>
  return (
    <div className="space-y-1">
      {enrollments.map((e: any) => (
        <div key={e.id} className="bg-gray-50 rounded-xl px-4 py-2 text-sm font-medium text-gray-700">
          {e.class_name || `Classe #${e.classe}`}
        </div>
      ))}
    </div>
  )
}