import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (adminOnly && userProfile?.role !== 'admin') {
    return <Navigate to="/" />
  }

  return children
}