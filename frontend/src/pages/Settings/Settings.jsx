import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Save,
  RefreshCw,
  Key,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSubscription } from '../../context/SubscriptionContext'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const { getCurrentPlan } = useSubscription()
  const [activeTab, setActiveTab] = useState('general')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const currentPlan = getCurrentPlan()

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ]

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock export data
      const exportData = {
        user: {
          name: user?.name,
          email: user?.email,
          role: user?.role
        },
        tasks: [],
        projects: [],
        timeEntries: [],
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `task-manager-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      setIsImporting(true)
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        // Validate import data structure
        if (!data.user || !data.exportDate) {
          throw new Error('Invalid export file format')
        }
        
        // Simulate import process
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        toast.success('Data imported successfully')
      } catch (error) {
        toast.error('Failed to import data: ' + error.message)
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleDeleteAccount = () => {
    const modal = document.getElementById('delete-account-modal')
    modal.showModal()
  }

  const confirmDeleteAccount = async () => {
    try {
      // Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Account deletion initiated')
      logout()
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  const generateApiKey = () => {
    const newKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    toast.success('New API key generated')
    return newKey
  }

  return (
    <>
      <Helmet>
        <title>Settings - Task Management</title>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-base-content/60">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-0">
                <ul className="menu menu-lg">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-3 ${
                            activeTab === tab.id ? 'active' : ''
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {tab.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">General Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Name</span>
                          </label>
                          <input 
                            type="text" 
                            className="input input-bordered" 
                            value={user?.name || ''} 
                            readOnly 
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Email</span>
                          </label>
                          <input 
                            type="email" 
                            className="input input-bordered" 
                            value={user?.email || ''} 
                            readOnly 
                          />
                        </div>
                      </div>
                      <p className="text-sm text-base-content/60 mt-2">
                        To update your account information, go to the Profile page.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Subscription</h3>
                      <div className="bg-base-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{currentPlan?.name} Plan</h4>
                            <p className="text-sm text-base-content/60">
                              {currentPlan?.price === 0 ? 'Free' : `$${currentPlan?.price}/month`}
                            </p>
                          </div>
                          <button 
                            onClick={() => window.location.href = '/subscription/plans'}
                            className="btn btn-outline btn-sm"
                          >
                            Manage Subscription
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Language & Region</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Language</span>
                          </label>
                          <select className="select select-bordered">
                            <option>English (US)</option>
                            <option>English (UK)</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                          </select>
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Timezone</span>
                          </label>
                          <select className="select select-bordered">
                            <option>UTC-8 (Pacific Time)</option>
                            <option>UTC-5 (Eastern Time)</option>
                            <option>UTC+0 (GMT)</option>
                            <option>UTC+1 (Central European Time)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Notification Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" defaultChecked />
                            <div>
                              <span className="label-text font-medium">Task assignments</span>
                              <div className="text-sm text-base-content/60">
                                When you're assigned to a new task
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" defaultChecked />
                            <div>
                              <span className="label-text font-medium">Due date reminders</span>
                              <div className="text-sm text-base-content/60">
                                Reminders for upcoming task deadlines
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" />
                            <div>
                              <span className="label-text font-medium">Weekly summaries</span>
                              <div className="text-sm text-base-content/60">
                                Weekly productivity and task completion reports
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Push Notifications</h3>
                      <div className="space-y-3">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" defaultChecked />
                            <div>
                              <span className="label-text font-medium">Real-time updates</span>
                              <div className="text-sm text-base-content/60">
                                Instant notifications for task updates
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" />
                            <div>
                              <span className="label-text font-medium">Team mentions</span>
                              <div className="text-sm text-base-content/60">
                                When someone mentions you in comments
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Password</h3>
                      <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">Change Password</h4>
                          <p className="text-sm text-base-content/60">
                            Last changed 30 days ago
                          </p>
                        </div>
                        <button 
                          onClick={() => window.location.href = '/profile'}
                          className="btn btn-outline btn-sm"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">2FA Status</h4>
                          <p className="text-sm text-base-content/60">
                            Not enabled - Secure your account with 2FA
                          </p>
                        </div>
                        <button className="btn btn-primary btn-sm">
                          Enable 2FA
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                          <div>
                            <h4 className="font-medium">Current Session</h4>
                            <p className="text-sm text-base-content/60">
                              Chrome on Windows • Active now
                            </p>
                          </div>
                          <span className="badge badge-success">Current</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                          <div>
                            <h4 className="font-medium">Mobile App</h4>
                            <p className="text-sm text-base-content/60">
                              iPhone • Last active 2 hours ago
                            </p>
                          </div>
                          <button className="btn btn-ghost btn-sm text-error">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy */}
            {activeTab === 'data' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Data & Privacy</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Data Export</h3>
                      <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">Export Your Data</h4>
                          <p className="text-sm text-base-content/60">
                            Download all your tasks, projects, and time entries
                          </p>
                        </div>
                        <button 
                          onClick={handleExportData}
                          className="btn btn-outline btn-sm"
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Export Data
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Data Import</h3>
                      <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                        <div>
                          <h4 className="font-medium">Import Data</h4>
                          <p className="text-sm text-base-content/60">
                            Import data from a previous export
                          </p>
                        </div>
                        <button 
                          onClick={handleImportData}
                          className="btn btn-outline btn-sm"
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Import Data
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Privacy Settings</h3>
                      <div className="space-y-3">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" defaultChecked />
                            <div>
                              <span className="label-text font-medium">Analytics</span>
                              <div className="text-sm text-base-content/60">
                                Help improve the app by sharing anonymous usage data
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" />
                            <div>
                              <span className="label-text font-medium">Marketing emails</span>
                              <div className="text-sm text-base-content/60">
                                Receive updates about new features and tips
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-error/20 pt-6">
                      <h3 className="font-semibold mb-4 text-error">Danger Zone</h3>
                      <div className="flex items-center justify-between p-4 bg-error/5 border border-error/20 rounded-lg">
                        <div>
                          <h4 className="font-medium text-error">Delete Account</h4>
                          <p className="text-sm text-base-content/60">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <button 
                          onClick={handleDeleteAccount}
                          className="btn btn-error btn-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Appearance Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Theme</h3>
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input
                            type="checkbox"
                            className="toggle"
                            checked={isDarkMode}
                            onChange={toggleTheme}
                          />
                          <div>
                            <span className="label-text font-medium">Dark Mode</span>
                            <div className="text-sm text-base-content/60">
                              Use dark theme for better viewing in low light
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Layout</h3>
                      <div className="space-y-3">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" defaultChecked />
                            <div>
                              <span className="label-text font-medium">Compact view</span>
                              <div className="text-sm text-base-content/60">
                                Show more content in less space
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox" />
                            <div>
                              <span className="label-text font-medium">Sidebar collapsed</span>
                              <div className="text-sm text-base-content/60">
                                Start with sidebar collapsed by default
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Display</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Date format</span>
                          </label>
                          <select className="select select-bordered">
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Time format</span>
                          </label>
                          <select className="select select-bordered">
                            <option>12-hour (AM/PM)</option>
                            <option>24-hour</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-6">Integrations</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">API Access</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                          <div>
                            <h4 className="font-medium">API Key</h4>
                            <p className="text-sm text-base-content/60">
                              Use this key to access the API programmatically
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <div className="form-control">
                              <div className="input-group">
                                <input 
                                  type={showApiKey ? 'text' : 'password'}
                                  className="input input-bordered input-sm w-64"
                                  value="sk_1234567890abcdef"
                                  readOnly
                                />
                                <button 
                                  className="btn btn-square btn-sm"
                                  onClick={() => setShowApiKey(!showApiKey)}
                                >
                                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            <button 
                              onClick={generateApiKey}
                              className="btn btn-outline btn-sm"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="alert alert-warning">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">
                            Keep your API key secure. Don't share it in publicly accessible areas.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Connected Apps</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold">S</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Slack</h4>
                              <p className="text-sm text-base-content/60">
                                Get notifications in Slack
                              </p>
                            </div>
                          </div>
                          <button className="btn btn-outline btn-sm">
                            Connect
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold">G</span>
                            </div>
                            <div>
                              <h4 className="font-medium">Google Calendar</h4>
                              <p className="text-sm text-base-content/60">
                                Sync tasks with Google Calendar
                              </p>
                            </div>
                          </div>
                          <button className="btn btn-outline btn-sm">
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <dialog id="delete-account-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error">Delete Account</h3>
          <p className="py-4">
            Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-base-content/70 mb-4">
            <li>All your tasks and projects</li>
            <li>Time tracking data</li>
            <li>Team memberships</li>
            <li>Account settings and preferences</li>
          </ul>
          <p className="text-sm text-error font-medium">
            Type "DELETE" to confirm:
          </p>
          <input 
            type="text" 
            className="input input-bordered w-full mt-2" 
            placeholder="Type DELETE to confirm"
          />
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost mr-2">Cancel</button>
              <button 
                onClick={confirmDeleteAccount}
                className="btn btn-error"
              >
                Delete Account
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default Settings