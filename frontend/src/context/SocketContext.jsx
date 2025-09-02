import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [typingUsers, setTypingUsers] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const { user, token } = useAuth()
  const queryClient = useQueryClient()

  // Check if WebSocket should be enabled
  const isWebSocketEnabled = import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false'

  // Initialize socket connection with comprehensive fallback
  useEffect(() => {
    // Skip WebSocket connection if disabled or no user
    if (!isWebSocketEnabled || !user) {
      setIsOfflineMode(true)
      console.log('🔌 WebSocket disabled or no user - running in offline mode')
      return
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    
    // Check if server is likely available
    const isLocalhost = serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')
    
    let connectionTimeout
    let newSocket

    try {
      newSocket = io(serverUrl, {
        auth: token ? { token } : {},
        transports: ['polling'], // Start with polling only for better compatibility
        timeout: 5000, // Shorter timeout for faster fallback
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3, // Fewer attempts to fail faster
        reconnectionDelay: 1000,
        reconnectionDelayMax: 3000,
        maxHttpBufferSize: 1e6,
        pingTimeout: 30000,
        pingInterval: 10000,
        autoConnect: false // Don't auto-connect, we'll do it manually
      })

      // Set a timeout to fallback to offline mode if connection takes too long
      connectionTimeout = setTimeout(() => {
        console.log('⏱️ WebSocket connection timeout - switching to offline mode')
        setIsOfflineMode(true)
        setConnectionError('Connection timeout')
        if (newSocket) {
          newSocket.close()
        }
      }, isLocalhost ? 3000 : 1000) // Shorter timeout for localhost

      // Connection events
      newSocket.on('connect', () => {
        clearTimeout(connectionTimeout)
        setIsConnected(true)
        setConnectionError(null)
        setReconnectAttempts(0)
        setIsOfflineMode(false)
        console.log('✅ Connected to WebSocket server')
        
        // Authenticate user with the server
        if (user && token) {
          newSocket.emit('authenticate', {
            userId: user.id,
            userName: user.name,
            token: token
          })
        }
        
        // Only show success toast after reconnection attempts
        if (reconnectAttempts > 0) {
          toast.success('Real-time features restored!', { 
            duration: 2000,
            id: 'websocket-reconnected'
          })
        }
      })

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false)
        console.log('❌ Disconnected from WebSocket server:', reason)
        
        // Don't show error for intentional disconnects
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          setIsOfflineMode(true)
        }
      })

      newSocket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout)
        setConnectionError(error.message)
        setIsConnected(false)
        setReconnectAttempts(prev => prev + 1)
        setIsOfflineMode(true)
        
        console.warn('⚠️ WebSocket connection failed - running in offline mode:', error.message)
        
        // Only show error toast after multiple attempts and not for localhost
        if (reconnectAttempts > 1 && !isLocalhost) {
          toast.error('Real-time features unavailable. App will work in offline mode.', { 
            duration: 4000,
            id: 'websocket-offline'
          })
        }
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
        setIsOfflineMode(false)
        toast.success('Real-time features restored!', { 
          duration: 2000,
          id: 'websocket-reconnected'
        })
      })

      newSocket.on('reconnect_error', (error) => {
        console.warn('🔄 Reconnection failed:', error.message)
        setIsOfflineMode(true)
      })

      newSocket.on('reconnect_failed', () => {
        console.warn('🔄 All reconnection attempts failed - staying in offline mode')
        setIsOfflineMode(true)
        toast.info('App running in offline mode. Some features may be limited.', {
          duration: 3000,
          id: 'websocket-offline-mode'
        })
      })

      // Online users tracking
      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users || [])
      })

      newSocket.on('userJoined', (userData) => {
        if (userData && userData.id !== user.id) {
          setOnlineUsers(prev => [...prev.filter(u => u.id !== userData.id), userData])
          toast.success(`${userData.name} joined`, { 
            duration: 2000,
            icon: '👋'
          })
        }
      })

      newSocket.on('userLeft', (userData) => {
        if (userData) {
          setOnlineUsers(prev => prev.filter(u => u.id !== userData.id))
        }
      })

      // Task-related events
      newSocket.on('taskUpdate', (data) => {
        console.log('📝 Task update received:', data)
        
        queryClient.invalidateQueries(['tasks'])
        queryClient.invalidateQueries(['task', data.task?._id])
        queryClient.invalidateQueries(['dashboard'])
        
        if (data.task && data.updatedBy !== user.id) {
          toast.success(`Task "${data.task.title}" was updated`, {
            duration: 3000,
            icon: '📝'
          })
        }
      })

      newSocket.on('taskAssigned', (data) => {
        console.log('👤 Task assigned:', data)
        
        queryClient.invalidateQueries(['tasks'])
        queryClient.invalidateQueries(['dashboard'])
        
        if (data.task && data.task.assignedTo._id === user.id) {
          toast.success(`You were assigned to "${data.task.title}"`, {
            duration: 5000,
            icon: '🎯'
          })
        }
      })

      newSocket.on('taskCompleted', (data) => {
        console.log('✅ Task completed:', data)
        
        queryClient.invalidateQueries(['tasks'])
        queryClient.invalidateQueries(['dashboard'])
        
        if (data.completedBy !== user.id) {
          toast.success(`"${data.task.title}" was completed!`, {
            duration: 4000,
            icon: '🎉'
          })
        }
      })

      // Typing indicators
      newSocket.on('user-typing', (data) => {
        if (data.userId !== user.id) {
          setTypingUsers(prev => ({
            ...prev,
            [data.taskId]: {
              ...prev[data.taskId],
              [data.userId]: {
                userName: data.userName,
                timestamp: Date.now()
              }
            }
          }))

          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newState = { ...prev }
              if (newState[data.taskId]) {
                delete newState[data.taskId][data.userId]
                if (Object.keys(newState[data.taskId]).length === 0) {
                  delete newState[data.taskId]
                }
              }
              return newState
            })
          }, 3000)
        }
      })

      newSocket.on('user-stopped-typing', (data) => {
        setTypingUsers(prev => {
          const newState = { ...prev }
          if (newState[data.taskId]) {
            delete newState[data.taskId][data.userId]
            if (Object.keys(newState[data.taskId]).length === 0) {
              delete newState[data.taskId]
            }
          }
          return newState
        })
      })

      // Notification events
      newSocket.on('notification', (notification) => {
        console.log('🔔 Notification received:', notification)
        
        queryClient.invalidateQueries(['notifications'])
        
        const toastOptions = {
          duration: 5000,
          icon: getNotificationIcon(notification.type)
        }

        switch (notification.type) {
          case 'task_assigned':
          case 'task_completed':
            toast.success(notification.message, toastOptions)
            break
          case 'task_overdue':
            toast.error(notification.message, { ...toastOptions, duration: 8000 })
            break
          case 'mention':
            toast.info(notification.message, { ...toastOptions, icon: '💬' })
            break
          default:
            toast.info(notification.message, toastOptions)
        }
      })

      // Try to connect
      newSocket.connect()
      setSocket(newSocket)

      return () => {
        clearTimeout(connectionTimeout)
        console.log('🔌 Cleaning up socket connection')
        if (newSocket) {
          newSocket.close()
        }
      }
    } catch (error) {
      clearTimeout(connectionTimeout)
      console.error('🔌 Failed to initialize WebSocket:', error)
      setIsOfflineMode(true)
      setConnectionError(error.message)
    }
  }, [user, token, queryClient, reconnectAttempts, isWebSocketEnabled])

  // Helper function to get notification icons
  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: '🎯',
      task_completed: '✅',
      task_overdue: '⚠️',
      task_comment: '💬',
      project_invitation: '📨',
      project_update: '📁',
      mention: '💬',
      deadline_reminder: '⏰',
      system_update: '📢',
      timer_reminder: '⏱️',
      team_update: '👥'
    }
    return icons[type] || '🔔'
  }

  // Socket event emitters with offline mode handling
  const emitTaskUpdate = useCallback((taskId, updateData) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('taskUpdate', { taskId, updateData })
    } else {
      console.log('📝 Task update queued (offline mode):', { taskId, updateData })
      // In a real app, you might queue these for when connection is restored
    }
  }, [socket, isConnected, isOfflineMode])

  const emitProjectUpdate = useCallback((projectId, updateData) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('projectUpdate', { projectId, updateData })
    } else {
      console.log('📁 Project update queued (offline mode):', { projectId, updateData })
    }
  }, [socket, isConnected, isOfflineMode])

  const joinProject = useCallback((projectId) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('join-project', projectId)
    }
  }, [socket, isConnected, isOfflineMode])

  const leaveProject = useCallback((projectId) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('leave-project', projectId)
    }
  }, [socket, isConnected, isOfflineMode])

  const joinTask = useCallback((taskId) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('join-task', taskId)
    }
  }, [socket, isConnected, isOfflineMode])

  const leaveTask = useCallback((taskId) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('leave-task', taskId)
    }
  }, [socket, isConnected, isOfflineMode])

  const startTyping = useCallback((taskId) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('typing-start', { taskId })
    }
  }, [socket, isConnected, isOfflineMode])

  const stopTyping = useCallback((taskId) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('typing-stop', { taskId })
    }
  }, [socket, isConnected, isOfflineMode])

  const emitTimerStart = useCallback((taskId, taskTitle) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('timer-start', { taskId, taskTitle })
    }
  }, [socket, isConnected, isOfflineMode])

  const emitTimerStop = useCallback((taskId, taskTitle, duration) => {
    if (socket && isConnected && !isOfflineMode) {
      socket.emit('timer-stop', { taskId, taskTitle, duration })
    }
  }, [socket, isConnected, isOfflineMode])

  const getTypingUsers = useCallback((taskId) => {
    if (isOfflineMode) return []
    
    const taskTyping = typingUsers[taskId] || {}
    return Object.values(taskTyping)
      .filter(user => Date.now() - user.timestamp < 3000)
      .map(user => user.userName)
  }, [typingUsers, isOfflineMode])

  const getOnlineUsers = useCallback(() => {
    return isOfflineMode ? [] : onlineUsers
  }, [onlineUsers, isOfflineMode])

  const isUserOnline = useCallback((userId) => {
    if (isOfflineMode) return false
    return onlineUsers.some(user => user.id === userId)
  }, [onlineUsers, isOfflineMode])

  const value = {
    socket,
    isConnected: isConnected && !isOfflineMode,
    connectionError,
    isOfflineMode,
    onlineUsers: isOfflineMode ? [] : onlineUsers,
    emitTaskUpdate,
    emitProjectUpdate,
    joinProject,
    leaveProject,
    joinTask,
    leaveTask,
    startTyping,
    stopTyping,
    emitTimerStart,
    emitTimerStop,
    getTypingUsers,
    getOnlineUsers,
    isUserOnline,
    typingUsers: isOfflineMode ? {} : typingUsers
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}