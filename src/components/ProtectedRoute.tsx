import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user profile doesn't exist or is still loading, allow access
  // The profile creation will be handled by the AuthContext
  if (!userProfile) {
    // Still allow access - profile might be being created
    return <>{children}</>
  }

  // Only check status if profile exists and has a status field
  if (userProfile.status && userProfile.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Pending</h2>
          <p className="text-gray-600">
            Your account is pending approval. Please check back later or contact an administrator.
          </p>
        </div>
      </div>
    )
  }

  if (adminOnly && userProfile?.role !== 'admin') {
    return <Navigate to="/directory" replace />
  }

  return <>{children}</>
}