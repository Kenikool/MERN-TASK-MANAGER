import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../Common/LoadingScreen'

const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl max-w-md">
          <div className="card-body text-center">
            <h2 className="card-title text-error justify-center">Access Denied</h2>
            <p className="text-base-content/60">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-base-content/40">
              Required role: {requiredRole}
            </p>
            <div className="card-actions justify-center mt-4">
              <button 
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check multiple roles if provided
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl max-w-md">
          <div className="card-body text-center">
            <h2 className="card-title text-error justify-center">Access Denied</h2>
            <p className="text-base-content/60">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-base-content/40">
              Required roles: {requiredRoles.join(', ')}
            </p>
            <div className="card-actions justify-center mt-4">
              <button 
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated and has required permissions
  return children
}

export default ProtectedRoute
