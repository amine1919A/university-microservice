import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const studentLinks = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/notes', label: 'Mes notes', icon: '📝' },
  { to: '/emploi', label: 'Emploi du temps', icon: '📅' },
  { to: '/factures', label: 'Factures', icon: '💰' },
  { to: '/messages', label: 'Messages', icon: '✉️' },
  { to: '/reclamations', label: 'Réclamations', icon: '⚠️' },
]

const teacherLinks = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/classes', label: 'Mes classes', icon: '👨‍🏫' },
  { to: '/notes', label: 'Saisie notes', icon: '📝' },
  { to: '/emploi', label: 'Emploi du temps', icon: '📅' },
  { to: '/messages', label: 'Messages', icon: '✉️' },
  { to: '/live', label: 'Live stream', icon: '📹' },
]

const adminLinks = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/users', label: 'Utilisateurs', icon: '👥' },
  { to: '/classes', label: 'Classes', icon: '🏫' },
  { to: '/matieres', label: 'Matières', icon: '📚' },
  { to: '/emploi', label: 'Emploi du temps', icon: '📅' },
  { to: '/factures', label: 'Facturation', icon: '💰' },
  { to: '/messages', label: 'Messages', icon: '✉️' },
  { to: '/reclamations', label: 'Réclamations', icon: '⚠️' },
  { to: '/live', label: 'Live stream', icon: '📹' },
]

export default function Sidebar() {
  const { user } = useAuthStore()

  const links = user?.role === 'admin'
    ? adminLinks
    : user?.role === 'teacher'
    ? teacherLinks
    : studentLinks

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-primary-700">Uni Platform</h2>
      </div>
      <nav className="p-2 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
            end={link.to === '/'}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
