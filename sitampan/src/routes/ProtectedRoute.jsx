import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading, role } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Memuat...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && roles.length && !roles.includes(role)) return <Navigate to="/" replace />
  return children
}
