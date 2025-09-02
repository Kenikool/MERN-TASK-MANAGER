import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import ConnectionStatus from '../Common/ConnectionStatus'
import InstallPrompt from '../PWA/InstallPrompt'
import UpdateNotification from '../PWA/UpdateNotification'

const Layout = () => {
  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />
      
      {/* Page content */}
      <div className="drawer-content flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Main content */}
          <main className="flex-1 p-6 bg-base-200 min-h-screen">
            <Outlet />
          </main>
          <ConnectionStatus />
          <InstallPrompt />
          <UpdateNotification />
      </div>
      
      {/* Sidebar */}
      <Sidebar />
    </div>
  )
}

export default Layout