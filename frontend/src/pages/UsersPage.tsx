import { useState, useEffect } from 'react'
import api from '../services/api'
import UserFormModal from '../components/UserFormModal'

export default function UsersPage() {
  const [authStudents, setAuthStudents] = useState<any[]>([])
  const [authTeachers, setAuthTeachers] = useState<any[]>([])
  const [profileStudents, setProfileStudents] = useState<any[]>([])
  const [profileTeachers, setProfileTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'students' | 'teachers'>('students')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<any | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    Promise.all([
      api.get('/auth/users/?role=student').catch(() => null),
      api.get('/auth/users/?role=teacher').catch(() => null),
      api.get('/users/students/').catch(() => null),
      api.get('/users/teachers/').catch(() => null),
    ]).then(([aSr, aTr, pSr, pTr]) => {
      if (aSr?.data) setAuthStudents(Array.isArray(aSr.data) ? aSr.data : aSr.data.results || [])
      if (aTr?.data) setAuthTeachers(Array.isArray(aTr.data) ? aTr.data : aTr.data.results || [])
      if (pSr?.data) setProfileStudents(Array.isArray(pSr.data) ? pSr.data : pSr.data.results || [])
      if (pTr?.data) setProfileTeachers(Array.isArray(pTr.data) ? pTr.data : pTr.data.results || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const authItems = tab === 'students' ? authStudents : authTeachers
  const profileItems = tab === 'students' ? profileStudents : profileTeachers

  const merged = authItems.map((a: any) => {
    const profile = profileItems.find((p: any) => p.external_id === a.id || p.id === a.id)
    return { ...a, ...profile, profile_id: profile?.id }
  })

  const handleEdit = (item: any) => {
    setEditTarget(item)
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    const endpoint = tab === 'students' ? `/users/students/${editTarget.profile_id}/` : `/users/teachers/${editTarget.profile_id}/`
    try {
      await api.patch(endpoint, {
        first_name: editTarget.first_name,
        last_name: editTarget.last_name,
        email: editTarget.email,
        phone: editTarget.phone,
        ...(tab === 'teachers' ? { specialization: editTarget.specialization } : {}),
      })
      setEditTarget(null)
      fetchUsers()
    } catch {
      alert("Erreur lors de la modification")
    }
  }

  const syncProfiles = async () => {
    for (const a of authItems) {
      const exists = profileItems.find((p: any) => p.external_id === a.id)
      if (!exists) {
        try {
          await api.post(`/users/${tab === 'students' ? 'students' : 'teachers'}/`, {
            external_id: a.id,
            first_name: a.first_name,
            last_name: a.last_name,
            email: a.email,
            phone: a.phone || '',
            ...(tab === 'teachers' ? { specialization: '' } : {}),
          })
        } catch {}
      }
    }
    fetchUsers()
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h1>
        <div className="flex gap-2">
          <button onClick={syncProfiles} className="btn-secondary text-sm py-2.5">
            Synchroniser
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2.5">
            + Ajouter un {tab === 'students' ? 'étudiant' : 'enseignant'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button onClick={() => setTab('students')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'students' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Étudiants ({authStudents.length})
        </button>
        <button onClick={() => setTab('teachers')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'teachers' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Enseignants ({authTeachers.length})
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nom</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Téléphone</th>
              {tab === 'teachers' && <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Spécialisation</th>}
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Statut</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? [...Array(3)].map((_, i) => (
              <tr key={i}>{[...Array(tab === 'teachers' ? 6 : 5)].map((_, j) => (
                <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
              ))}</tr>
            )) : merged.length === 0 ? (
              <tr><td colSpan={tab === 'teachers' ? 6 : 5} className="px-6 py-12 text-center text-gray-400">
                Aucun {tab === 'students' ? 'étudiant' : 'enseignant'} trouvé
              </td></tr>
            ) : merged.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{u.first_name} {u.last_name}</p>
                      {!u.profile_id && <span className="text-xs text-amber-500">(pas de profil)</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.phone || '—'}</td>
                {tab === 'teachers' && <td className="px-6 py-4 text-sm text-gray-500">{u.specialization || '—'}</td>}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${u.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {u.is_active !== false ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors">Modifier</button>
                  <button onClick={async () => {
                    if (!confirm(`Supprimer ${u.first_name} ${u.last_name} ?`)) return
                    try {
                      if (u.profile_id) await api.delete(`/users/${tab === 'students' ? 'students' : 'teachers'}/${u.profile_id}/`)
                      await api.delete(`/auth/users/${u.id}/`)
                      fetchUsers()
                    } catch { alert('Erreur lors de la suppression') }
                  }} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors ml-3">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserFormModal type={tab} onClose={() => setShowModal(false)} onSaved={fetchUsers} />
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Modifier {tab === 'students' ? "l'étudiant" : "l'enseignant"}
              </h2>
              <button onClick={() => setEditTarget(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Prénom</label>
                  <input type="text" value={editTarget.first_name} onChange={e => setEditTarget({...editTarget, first_name: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                  <input type="text" value={editTarget.last_name} onChange={e => setEditTarget({...editTarget, last_name: e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={editTarget.email} onChange={e => setEditTarget({...editTarget, email: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                <input type="tel" value={editTarget.phone || ''} onChange={e => setEditTarget({...editTarget, phone: e.target.value})} className="input-field" />
              </div>
              {tab === 'teachers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Spécialisation</label>
                  <input type="text" value={editTarget.specialization || ''} onChange={e => setEditTarget({...editTarget, specialization: e.target.value})} className="input-field" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={handleUpdate} className="btn-primary flex-1">Enregistrer</button>
                <button onClick={() => setEditTarget(null)} className="btn-secondary flex-1">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
