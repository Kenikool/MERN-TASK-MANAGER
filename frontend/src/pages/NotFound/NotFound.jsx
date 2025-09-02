import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/dashboard')
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <>
      <Helmet>
        <title>Page Not Found - Task Management</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
        <div className="text-center max-w-md">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative">
              <div className="text-9xl font-bold text-primary/20 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileQuestion className="w-24 h-24 text-primary/60" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content mb-4">
              Page Not Found
            </h1>
            <p className="text-base-content/60 text-lg mb-2">
              Oops! The page you're looking for doesn't exist.
            </p>
            <p className="text-base-content/50 text-sm">
              It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleGoHome}
                className="btn btn-primary"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </button>
              
              <button
                onClick={handleGoBack}
                className="btn btn-outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
            </div>

            {/* Search Suggestion */}
            <div className="mt-8 p-4 bg-base-100 rounded-lg border border-base-300">
              <div className="flex items-center gap-2 text-base-content/60 mb-2">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Looking for something specific?</span>
              </div>
              <div className="text-sm text-base-content/50">
                Try using the search feature in the header or check these popular pages:
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => navigate('/tasks')}
                  className="btn btn-ghost btn-xs"
                >
                  Tasks
                </button>
                <button
                  onClick={() => navigate('/projects')}
                  className="btn btn-ghost btn-xs"
                >
                  Projects
                </button>
                <button
                  onClick={() => navigate('/team')}
                  className="btn btn-ghost btn-xs"
                >
                  Team
                </button>
                <button
                  onClick={() => navigate('/calendar')}
                  className="btn btn-ghost btn-xs"
                >
                  Calendar
                </button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-xs text-base-content/40">
            If you believe this is an error, please contact support.
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound