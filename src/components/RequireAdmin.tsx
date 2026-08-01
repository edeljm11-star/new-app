import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminSession } from '../hooks/useAdminSession'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading } = useAdminSession()

  if (loading) return null
  if (!session) return <Navigate to="/admin/login" replace />
  return children
}
