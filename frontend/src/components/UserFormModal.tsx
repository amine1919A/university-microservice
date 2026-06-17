import { useState } from 'react'
import api from '../services/api'

interface Props {
  type: 'students' | 'teachers'
  onClose: () => void
  onSaved: () => void
}

export default function UserFormModal({ type, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    password: '',
    password2: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authRes = await api.post('/auth/admin-create/', {
        username: form.username || form.email.split('@')[0],
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        role: type === 'teachers' ? 'teacher' : 'student',
        phone: form.phone,
        password: form.password,
        password2: form.password2,
      })
      const authUser = authRes.data.user
      const password = authRes.data.generated_password
      setGeneratedPassword(password)

      await api.post(`/users/${type === 'teachers' ? 'teachers' : 'students'}/`, {
        external_id: authUser.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        ...(type === 'teachers' ? { specialization: form.specialization } : {}),
      })
      onSaved()
    } catch (err: any) {
      const data = err.response?.data
      if (data) setError(Object.values(data).flat().join(', '))
      else setError("Erreur lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {generatedPassword ? 'Compte créé avec succès' : `Ajouter un ${type === 'students' ? 'étudiant' : 'enseignant'}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {generatedPassword ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <p className="font-medium mb-2">Compte créé ! Identifiants à communiquer à l'utilisateur :</p>
              <p><strong>Email:</strong> {form.email}</p>
              <p><strong>Mot de passe:</strong> <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{generatedPassword}</span></p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">Fermer</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Prénom</label>
                <input type="text" value={form.first_name} onChange={e => update('first_name', e.target.value)} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nom</label>
                <input type="text" value={form.last_name} onChange={e => update('last_name', e.target.value)} required className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mot de passe</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Confirmer mot de passe</label>
                <input type="password" value={form.password2} onChange={e => update('password2', e.target.value)} required className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nom d'utilisateur</label>
                <input type="text" value={form.username} onChange={e => update('username', e.target.value)} className="input-field" placeholder="auto: email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field" />
              </div>
            </div>
            {type === 'teachers' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Spécialisation</label>
                <input type="text" value={form.specialization} onChange={e => update('specialization', e.target.value)} className="input-field" placeholder="ex: Mathématiques" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Enregistrement...' : 'Créer le compte'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
