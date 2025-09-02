import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell } from 'lucide-react'

const NotificationToast = ({ 
  notification, 
  onClose, 
  onAction,
  autoClose = true,
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100)

    if (autoClose) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100))
          if (newProgress <= 0) {
            clearInterval(progressInterval)
            handleClose()
            return 0
          }
          return newProgress
        })
      }, 100)

      return () => clearInterval(progressInterval)
    }
  }, [autoClose, duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-success',
          textColor: 'text-success-content',
          borderColor: 'border-success',
          progressColor: 'bg-success-content/30'
        }
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-error',
          textColor: 'text-error-content',
          borderColor: 'border-error',
          progressColor: 'bg-error-content/30'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-warning',
          textColor: 'text-warning-content',
          borderColor: 'border-warning',
          progressColor: 'bg-warning-content/30'
        }
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-info',
          textColor: 'text-info-content',
          borderColor: 'border-info',
          progressColor: 'bg-info-content/30'
        }
      default:
        return {
          icon: Bell,
          bgColor: 'bg-base-100',
          textColor: 'text-base-content',
          borderColor: 'border-base-300',
          progressColor: 'bg-base-content/20'
        }
    }
  }

  const style = getNotificationStyle()
  const Icon = style.icon

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`card ${style.bgColor} ${style.textColor} shadow-lg border ${style.borderColor}`}>
        <div className="card-body p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {notification.title && (
                <h4 className="font-semibold text-sm mb-1">
                  {notification.title}
                </h4>
              )}
              <p className="text-sm opacity-90">
                {notification.message}
              </p>

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onAction?.(action)
                        if (action.closeOnClick !== false) {
                          handleClose()
                        }
                      }}
                      className={`btn btn-xs ${
                        action.primary 
                          ? 'btn-primary' 
                          : 'btn-ghost hover:bg-white/20'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              {notification.timestamp && (
                <div className="text-xs opacity-70 mt-2">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-xs btn-circle opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          {autoClose && (
            <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full ${style.progressColor} transition-all duration-100 ease-linear`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Notification Manager Component
export const NotificationManager = () => {
  const [notifications, setNotifications] = useState([])

  // Listen for custom notification events
  useEffect(() => {
    const handleNotification = (event) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...event.detail
      }
      
      setNotifications(prev => [...prev, notification])
    }

    window.addEventListener('show-notification', handleNotification)
    return () => window.removeEventListener('show-notification', handleNotification)
  }, [])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleAction = (action) => {
    if (action.callback) {
      action.callback()
    }
    if (action.url) {
      window.open(action.url, action.target || '_self')
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => removeNotification(notification.id)}
            onAction={handleAction}
            autoClose={notification.autoClose !== false}
            duration={notification.duration || 5000}
          />
        </div>
      ))}
    </div>
  )
}

// Utility function to show notifications
export const showNotification = (notification) => {
  const event = new CustomEvent('show-notification', {
    detail: notification
  })
  window.dispatchEvent(event)
}

// Predefined notification types
export const notificationTypes = {
  taskAssigned: (taskTitle, assignedBy) => ({
    type: 'info',
    title: 'Task Assigned',
    message: `You've been assigned to "${taskTitle}" by ${assignedBy}`,
    actions: [
      { label: 'View Task', primary: true, callback: () => console.log('View task') },
      { label: 'Dismiss', closeOnClick: true }
    ]
  }),

  taskCompleted: (taskTitle, completedBy) => ({
    type: 'success',
    title: 'Task Completed',
    message: `"${taskTitle}" was completed by ${completedBy}`,
    actions: [
      { label: 'View Details', primary: true }
    ]
  }),

  taskOverdue: (taskTitle, daysOverdue) => ({
    type: 'warning',
    title: 'Task Overdue',
    message: `"${taskTitle}" is ${daysOverdue} day(s) overdue`,
    actions: [
      { label: 'Update Task', primary: true },
      { label: 'Extend Deadline' }
    ],
    autoClose: false
  }),

  projectDeadline: (projectName, daysLeft) => ({
    type: 'warning',
    title: 'Project Deadline Approaching',
    message: `"${projectName}" is due in ${daysLeft} day(s)`,
    actions: [
      { label: 'View Project', primary: true },
      { label: 'Update Status' }
    ]
  }),

  systemUpdate: (version) => ({
    type: 'info',
    title: 'System Update Available',
    message: `Version ${version} is now available with new features and improvements`,
    actions: [
      { label: 'Update Now', primary: true },
      { label: 'Later' }
    ],
    autoClose: false
  }),

  connectionLost: () => ({
    type: 'error',
    title: 'Connection Lost',
    message: 'Unable to connect to server. Some features may be limited.',
    autoClose: false
  }),

  connectionRestored: () => ({
    type: 'success',
    title: 'Connection Restored',
    message: 'Successfully reconnected to server. All features are now available.'
  })
}

export default NotificationToast