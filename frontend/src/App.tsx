import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ClassesPage from './pages/ClassesPage'
import SubjectsPage from './pages/SubjectsPage'
import GradesPage from './pages/GradesPage'
import TeacherGradeEntry from './pages/TeacherGradeEntry'
import SchedulePage from './pages/SchedulePage'
import MessagesPage from './pages/MessagesPage'
import LivePage from './pages/LivePage'
import LiveRoomPage from './pages/LiveRoomPage'
import ComplaintsPage from './pages/ComplaintsPage'
import BillingPage from './pages/BillingPage'
import ProfilePage from './pages/ProfilePage'
import { useShallow } from 'zustand/react/shallow'

function NotesPage() {
  const { user } = useAuthStore(useShallow((s) => ({ user: s.user })))
  return user?.role === 'teacher' ? <TeacherGradeEntry /> : <GradesPage />
}

export default function App() {
  const { loadUser, isLoading } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-float shadow-lg shadow-indigo-500/30">
            <svg className="w-8 h-8 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-white/60 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="matieres" element={<SubjectsPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="emploi" element={<SchedulePage />} />
        <Route path="factures" element={<BillingPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="reclamations" element={<ComplaintsPage />} />
        <Route path="live" element={<LivePage />} />
        <Route path="live/:id" element={<LiveRoomPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
