import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, Sun, Moon, User, LogOut, Settings, Command, Crown  } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { useSocket } from '../../context/SocketContext'
import { GlobalTimer } from '../TimeTracking/SimpleTimer'
import SimpleNotificationCenter from '../Notifications/SimpleNotificationCenter'
import GlobalSearch from '../Common/GlobalSearch'

const Header = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { subscription, getCurrentPlan } = useSubscription()
  const { isConnected, isOfflineMode } = useSocket()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const currentPlan = getCurrentPlan()

  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShowSearch(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New task assigned: "Update user interface"', time: '2 min ago' },
    { id: 2, message: 'Project deadline approaching: "Mobile App"', time: '1 hour ago' },
    { id: 3, message: 'Task completed: "Database optimization"', time: '3 hours ago' },
  ]

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4 lg:px-6">
      {/* Mobile menu button */}
      <div className="navbar-start">
        <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost lg:hidden">
          <Menu className="w-6 h-6" />
        </label>
        
        {/* Search button */}
        <button 
          className="btn btn-ghost btn-circle ml-2"
          onClick={() => setShowSearch(true)}
          title="Search (Ctrl + /)"
        >
          <Search className="w-5 h-5" />
        </button>
        
        {/* Title */}
        <h1 className="text-xl font-bold ml-4 hidden sm:block">
          Task Management
        </h1>
      </div>

      {/* Center - Search Bar for larger screens */}
      <div className="navbar-center hidden lg:flex">
        <button
          onClick={() => setShowSearch(true)}
          className="btn btn-ghost btn-sm gap-2 min-w-64 justify-start text-base-content/60"
        >
          <Search className="w-4 h-4" />
          <span>Search tasks, projects...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="kbd kbd-xs">Ctrl</kbd>
            <kbd className="kbd kbd-xs">/</kbd>
          </div>
        </button>
      </div>

      {/* Right side - User actions */}
      <div className="navbar-end flex items-center gap-2">
        {/* Connection Status Indicator */}
        {isOfflineMode && (
          <div className="tooltip tooltip-bottom" data-tip="App is running in offline mode">
            <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="hidden sm:inline">Offline</span>
            </div>
          </div>
        )}
        
        {/* Global Timer */}
        <GlobalTimer />
        
        {/* Notifications */}
        <SimpleNotificationCenter />

        {/* Theme Toggle */}
        <button 
          className="btn btn-ghost btn-circle"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User menu */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-8 rounded-full">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="bg-primary text-primary-content w-8 h-8 rounded-full flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
            <li className="menu-title">
              <span>{user?.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60">{user?.role}</span>
                <span className={`badge badge-xs ${
                  currentPlan?.id === 'free' ? 'badge-ghost' :
                  currentPlan?.id === 'basic' ? 'badge-primary' :
                  currentPlan?.id === 'pro' ? 'badge-secondary' : 'badge-accent'
                }`}>
                  {currentPlan?.name}
                </span>
              </div>
            </li>
            <li>
              <button onClick={handleProfile} className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/subscription/plans')} className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Subscription
              </button>
            </li>
            <li>
              <button onClick={handleSettings} className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </li>
            <li>
              <button onClick={handleLogout} className="flex items-center gap-2 text-error">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />
    </header>
  )
}

export default Header