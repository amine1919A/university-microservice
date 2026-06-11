import { useAuthStore } from '../store/authStore'

const stats = {
  admin: [
    { label: 'Étudiants', value: '0', color: 'bg-blue-500' },
    { label: 'Enseignants', value: '0', color: 'bg-green-500' },
    { label: 'Classes', value: '0', color: 'bg-purple-500' },
    { label: 'Matières', value: '0', color: 'bg-orange-500' },
  ],
  teacher: [
    { label: 'Mes classes', value: '0', color: 'bg-blue-500' },
    { label: 'Mes matières', value: '0', color: 'bg-green-500' },
    { label: 'Étudiants', value: '0', color: 'bg-purple-500' },
    { label: 'Cours today', value: '0', color: 'bg-orange-500' },
  ],
  student: [
    { label: 'Moyenne', value: '--', color: 'bg-blue-500' },
    { label: 'Matières', value: '0', color: 'bg-green-500' },
    { label: 'Cours this week', value: '0', color: 'bg-purple-500' },
    { label: 'Messages', value: '0', color: 'bg-orange-500' },
  ],
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const currentStats = stats[user?.role || 'student']

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Tableau de bord
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Bienvenue sur University Platform
        </h3>
        <p className="text-gray-600">
          {user?.role === 'admin'
            ? "Vous êtes connecté en tant qu'Administrateur. Vous pouvez gérer les utilisateurs, les classes, les matières et toutes les fonctionnalités de la plateforme."
            : user?.role === 'teacher'
            ? "Vous êtes connecté en tant qu'Enseignant. Vous pouvez gérer vos classes, saisir les notes et communiquer avec les étudiants."
            : 'Vous êtes connecté en tant qu\'Étudiant. Vous pouvez consulter vos notes, votre emploi du temps et communiquer avec vos enseignants.'}
        </p>
      </div>
    </div>
  )
}
