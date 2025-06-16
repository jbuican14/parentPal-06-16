import React, { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import AuthPage from './AuthPage'

interface AuthWrapperProps {
  children: React.ReactNode
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading, isConfigured } = useAuth()

  // Prevent back-button access to protected routes
  useEffect(() => {
    if (!user && isConfigured) {
      // Clear browser history to prevent back-button access
      window.history.replaceState(null, '', window.location.pathname)
      
      // Add event listener to prevent back navigation
      const handlePopState = (event: PopStateEvent) => {
        if (!user) {
          window.history.pushState(null, '', window.location.pathname)
        }
      }
      
      window.addEventListener('popstate', handlePopState)
      
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [user, isConfigured])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="bg-orange-100 p-4 rounded-full w-fit mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Supabase Not Connected</h2>
          <p className="text-gray-600 mb-6">
            To use ParentPal with database functionality, please connect to Supabase by clicking the "Connect to Supabase" button in the top right corner.
          </p>
          <p className="text-sm text-gray-500">
            The app will work in demo mode until Supabase is connected.
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <>{children}</>
}

export default AuthWrapper