import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute({ children, role }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-butter flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (role && profile?.role !== role) {
    const redirect = profile?.role === 'coach' ? '/coach/overview' : '/student/dashboard'
    return <Navigate to={redirect} replace />
  }

  return children
}
