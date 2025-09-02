import React, { useState, useEffect } from 'react'
import {
  Users,
  Video,
  MessageSquare,
  Share2,
  Eye,
  UserPlus,
  Crown,
  Shield,
  Settings,
  Activity,
  Clock,
  Calendar,
  Bell,
  Phone,
  Mail,
  Globe,
  Zap,
  Star,
  AlertCircle
} from 'lucide-react'
import { useSocket } from '../../context/SocketContext'
import { useSubscription } from '../../context/SubscriptionContext'
import FeatureGate from '../Common/FeatureGate'

const TeamCollaboration = ({ projectId, taskId }) => {
  const { isConnected, isOfflineMode, onlineUsers, getTypingUsers, joinProject, leaveProject } = useSocket()
  const { hasFeature, getCurrentPlan } = useSubscription()
  const [activeTab, setActiveTab] = useState('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  
  const currentPlan = getCurrentPlan()
  const typingUsers = taskId ? getTypingUsers(taskId) : []

  // Mock team data - replace with real API calls
  const [teamMembers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      avatar: null,
      status: 'online',
      lastActive: new Date(),
      permissions: ['read', 'write', 'admin']
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'member',
      avatar: null,
      status: 'away',
      lastActive: new Date(Date.now() - 30 * 60 * 1000),
      permissions: ['read', 'write']
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'viewer',
      avatar: null,
      status: 'offline',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      permissions: ['read']
    }
  ])

  const [recentActivity] = useState([
    {
      id: 1,
      user: 'John Doe',
      action: 'completed task',
      target: 'Update user interface',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'commented on',
      target: 'Database optimization',
      timestamp: new Date(Date.now() - 15 * 60 * 1000)
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'joined project',
      target: 'Mobile App Development',
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    }
  ])

  useEffect(() => {
    if (projectId && hasFeature('teamMembers')) {
      joinProject(projectId)
      return () => leaveProject(projectId)
    }
  }, [projectId, hasFeature, joinProject, leaveProject])

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-success'
      case 'away': return 'bg-warning'
      case 'busy': return 'bg-error'
      default: return 'bg-base-300'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-warning" />
      case 'member': return <Users className="w-4 h-4 text-primary" />
      case 'viewer': return <Eye className="w-4 h-4 text-base-content/60" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!hasFeature('teamMembers')) {
    return (
      <FeatureGate 
        feature="teamMembers" 
        requiredPlan="basic"
        className="min-h-96"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Collaboration</h2>
          <p className="text-base-content/60">
            Collaborate with your team in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-success/10 text-success' : 
            isOfflineMode ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success' : 
              isOfflineMode ? 'bg-warning' : 'bg-error'
            }`}></div>
            {isConnected ? 'Connected' : isOfflineMode ? 'Offline Mode' : 'Connecting...'}
          </div>

          <button 
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary btn-sm"
            disabled={!hasFeature('teamMembers')}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Plan Limits & Connection Status */}
      <div className="space-y-3">
        <div className="alert alert-info">
          <Shield className="w-4 h-4" />
          <div>
            <div className="font-medium">
              {currentPlan?.name} Plan - {
                currentPlan?.limits.teamMembers === -1 
                  ? 'Unlimited' 
                  : `${teamMembers.length}/${currentPlan?.limits.teamMembers}`
              } team members
            </div>
            {currentPlan?.limits.teamMembers !== -1 && teamMembers.length >= currentPlan?.limits.teamMembers && (
              <div className="text-sm">
                Upgrade to add more team members
              </div>
            )}
          </div>
        </div>
        
        {isOfflineMode && (
          <div className="alert alert-warning">
            <AlertCircle className="w-4 h-4" />
            <div>
              <div className="font-medium">Offline Mode</div>
              <div className="text-sm">
                Real-time collaboration features are temporarily unavailable. Core team features still work.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button 
          className={`tab ${activeTab === 'members' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users className="w-4 h-4 mr-2" />
          Members ({teamMembers.length})
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity className="w-4 h-4 mr-2" />
          Activity
        </button>
        <button 
          className={`tab ${activeTab === 'communication' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('communication')}
          disabled={!hasFeature('advancedReports')}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Communication
          {!hasFeature('advancedReports') && <Star className="w-3 h-3 ml-1 text-warning" />}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h3 className="font-semibold mb-3">Currently Online ({onlineUsers.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2 bg-success/10 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Team Members List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map(member => (
              <div key={member.id} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} />
                          ) : (
                            <div className="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-100 ${getStatusColor(member.status)}`}></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{member.name}</h4>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-xs text-base-content/60">{member.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Status:</span>
                      <span className="capitalize font-medium">{member.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Last active:</span>
                      <span>{formatTimeAgo(member.lastActive)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Role:</span>
                      <span className="capitalize font-medium">{member.role}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button className="btn btn-ghost btn-xs flex-1">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Message
                    </button>
                    <button className="btn btn-ghost btn-xs">
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Recent Team Activity</h3>
            
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <div className="bg-primary text-primary-content w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold">
                        {activity.user.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-medium">"{activity.target}"</span>
                    </p>
                    <p className="text-xs text-base-content/60">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'communication' && (
        <FeatureGate feature="advancedReports" requiredPlan="pro">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Calls */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="font-semibold mb-4">Video Collaboration</h3>
                
                <div className="space-y-3">
                  <button className="btn btn-primary w-full">
                    <Video className="w-4 h-4 mr-2" />
                    Start Video Call
                  </button>
                  
                  <button className="btn btn-outline w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Audio Call
                  </button>
                  
                  <button className="btn btn-outline w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Screen Share
                  </button>
                </div>
              </div>
            </div>

            {/* Team Chat */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="font-semibold mb-4">Team Chat</h3>
                
                <div className="space-y-3">
                  <div className="bg-base-200 rounded-lg p-3 h-32 overflow-y-auto">
                    <p className="text-sm text-base-content/60 text-center">
                      Team chat will appear here
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="input input-bordered flex-1 input-sm"
                    />
                    <button className="btn btn-primary btn-sm">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FeatureGate>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Invite Team Member</h3>
              
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input 
                    type="email" 
                    placeholder="colleague@example.com" 
                    className="input input-bordered"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select className="select select-bordered">
                    <option value="viewer">Viewer - Can view only</option>
                    <option value="member">Member - Can edit</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Message (Optional)</span>
                  </label>
                  <textarea 
                    placeholder="Welcome to our team!" 
                    className="textarea textarea-bordered"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button className="btn btn-primary">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamCollaboration