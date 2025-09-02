import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
 LayoutDashboard,
 CheckSquare,
 Folder,
 Users,
 BarChart3,
 User,
 Clock,
 Calendar,
 Settings
} from "lucide-react";
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../utils/cn'

const menuItems = [
  {
    text: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['admin', 'manager', 'member'],
  },
  {
    text: 'Tasks',
    icon: CheckSquare,
    path: '/tasks',
    roles: ['admin', 'manager', 'member'],
  },
  {
    text: 'Projects',
    icon: Folder,
    path: '/projects',
    roles: ['admin', 'manager', 'member'],
  },
  {
    text: 'Team',
    icon: Users,
    path: '/team',
    roles: ['admin', 'manager'],
  },
  {
    text: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['admin', 'manager']
  },
  {
    text: 'Time Tracking',
    path: '/time',
    icon: Clock,
    roles: ['admin', 'manager', 'member']
  },
  {
    text: 'Calendar',
    path: '/calendar',
    icon: Calendar,
    roles: ['admin', 'manager', 'member']
  },
]

const bottomMenuItems = [
  {
    text: 'Profile',
    icon: User,
    path: '/profile',
    roles: ['admin', 'manager', 'member'],
  },
  {
    text: 'Settings',
    icon: Settings,
    path: '/settings',
    roles: ['admin', 'manager', 'member'],
  },
]

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleNavigation = (path) => {
    navigate(path)
    // Close drawer on mobile
    const drawerToggle = document.getElementById('drawer-toggle')
    if (drawerToggle) {
      drawerToggle.checked = false
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const canAccessItem = (item) => {
    return item.roles.includes(user?.role)
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-base-200">
      {/* User Profile Section */}
      <div className="bg-primary text-primary-content p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-12 rounded-full">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="bg-primary-focus text-primary-content w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{user?.name}</h3>
            <p className="text-primary-content/80 text-sm capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        {user?.department && (
          <p className="text-primary-content/70 text-sm">
            {user.department}
          </p>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="menu menu-md gap-1">
          {menuItems
            .filter(canAccessItem)
            .map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <li key={item.text}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors duration-200',
                      active
                        ? 'bg-primary text-primary-content'
                        : 'hover:bg-base-300 text-base-content'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.text}</span>
                  </button>
                </li>
              )
            })}
        </ul>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-base-300 p-4">
        <ul className="menu menu-md gap-1">
          {bottomMenuItems
            .filter(canAccessItem)
            .map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <li key={item.text}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors duration-200',
                      active
                        ? 'bg-primary text-primary-content'
                        : 'hover:bg-base-300 text-base-content'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.text}</span>
                  </button>
                </li>
              )
            })}
        </ul>
      </div>
    </div>
  )

  return (
    <div className="drawer-side">
      <label htmlFor="drawer-toggle" aria-label="close sidebar" className="drawer-overlay"></label>
      <aside className="w-80 min-h-full">
        <SidebarContent />
      </aside>
    </div>
  )
}

export default Sidebar