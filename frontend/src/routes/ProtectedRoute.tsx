import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'
import type { JSX } from 'react/jsx-dev-runtime'

interface Props {
  children: JSX.Element
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const redirects: Record<Role, string> = {
      admin: '/admin',
      doctor: '/doctor',
      patient: '/patient',
    }
    return <Navigate to={redirects[role]} replace />
  }

  return children
}