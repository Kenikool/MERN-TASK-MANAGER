import React, { useState } from 'react'
import {
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  X
} from 'lucide-react'
import { useSocket } from '../../context/SocketContext'

const ConnectionStatus = () => {
  const { isConnected, isOfflineMode, connectionError, onlineUsers } = useSocket()
  const [showDetails, setShowDetails] = useState(false)

  // Don't show anything if we're in offline mode by design
  if (isOfflineMode && !connectionError) {
    return null
  }

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Connected',
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20'
      }
    } else if (isOfflineMode) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Offline Mode',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/20'
      }
    } else {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: 'Connecting...',
        color: 'text-info',
        bgColor: 'bg-info/10',
        borderColor: 'border-info/20'
      }
    }
  }

  const status = getStatusInfo()

  const handleRetryConnection = () => {
    // Reload the page to retry connection
    window.location.reload()
  }

  return (
    <>
      {/* Status Indicator */}
      <div 
        className={`fixed top-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ${status.bgColor} ${status.borderColor} ${status.color}`}
        onClick={() => setShowDetails(true)}
      >
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
        {isConnected && onlineUsers.length > 0 && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {onlineUsers.length} online
          </span>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Connection Status</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Details */}
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${status.bgColor} ${status.borderColor} border`}>
                  {status.icon}
                  <div>
                    <div className={`font-medium ${status.color}`}>{status.text}</div>
                    <div className="text-sm text-base-content/60">
                      {isConnected && 'Real-time features are active'}
                      {isOfflineMode && 'App is working in offline mode'}
                      {!isConnected && !isOfflineMode && 'Attempting to connect...'}
                    </div>
                  </div>
                </div>

                {/* Connection Error */}
                {connectionError && (
                  <div className="flex items-start gap-3 p-3 bg-error/10 border border-error/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-error">Connection Error</div>
                      <div className="text-sm text-base-content/60 mt-1">
                        {connectionError}
                      </div>
                    </div>
                  </div>
                )}

                {/* Online Users */}
                {isConnected && onlineUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Online Team Members ({onlineUsers.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {onlineUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-sm">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features Status */}
                <div>
                  <h4 className="font-medium mb-2">Feature Availability</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Real-time Updates</span>
                      <span className={isConnected ? 'text-success' : 'text-base-content/40'}>
                        {isConnected ? '✓ Active' : '✗ Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Live Collaboration</span>
                      <span className={isConnected ? 'text-success' : 'text-base-content/40'}>
                        {isConnected ? '✓ Active' : '✗ Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Instant Notifications</span>
                      <span className={isConnected ? 'text-success' : 'text-base-content/40'}>
                        {isConnected ? '✓ Active' : '✗ Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Core Features</span>
                      <span className="text-success">✓ Active</span>
                    </div>
                  </div>
                </div>

                {/* Offline Mode Info */}
                {isOfflineMode && (
                  <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                    <h4 className="font-medium text-info mb-2">Offline Mode</h4>
                    <div className="text-sm text-base-content/70">
                      <p>The app is running in offline mode. All core features are available:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Create and manage tasks</li>
                        <li>Track time and productivity</li>
                        <li>View analytics and reports</li>
                        <li>Access all subscription features</li>
                      </ul>
                      <p className="mt-2">
                        Real-time collaboration features will be restored when connection is available.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {!isConnected && (
                    <button
                      onClick={handleRetryConnection}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Connection
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDetails(false)}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ConnectionStatus