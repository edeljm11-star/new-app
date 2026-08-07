import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { ADMIN_EMAILS } from '../lib/adminEmails'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading) return null
  if (!session) return <Navigate to="/admin/login" replace />
  if (!ADMIN_EMAILS.includes(session.user.email ?? '')) return <Navigate to="/" replace />
  return children
}
