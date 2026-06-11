import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Sidebar from './Sidebar'

export default function Layout() {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-xl font-semibold text-gray-800">
              University Platform
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.first_name} {user?.last_name}
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700">
                  {user?.role === 'admin' ? 'Administrateur' : user?.role === 'teacher' ? 'Enseignant' : 'Étudiant'}
                </span>
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
