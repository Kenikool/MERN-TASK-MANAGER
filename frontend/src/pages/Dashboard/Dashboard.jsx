import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Award,
  Timer,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { tasksAPI, projectsAPI, analyticsAPI } from '../../utils/api'
import SimpleTimer from '../../components/TimeTracking/SimpleTimer'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', selectedPeriod],
    queryFn: () => analyticsAPI.getDashboard({ period: selectedPeriod }),
    select: (data) => data.data,
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch recent tasks
  const { data: recentTasksData } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => tasksAPI.getTasks({ limit: 5, sort: '-updatedAt' }),
    select: (data) => data.data.tasks || []
  })

  // Fetch active projects
  const { data: activeProjectsData } = useQuery({
    queryKey: ['active-projects'],
    queryFn: () => projectsAPI.getProjects({ status: 'active', limit: 3 }),
    select: (data) => data.data.projects || []
  })

  const stats = dashboardData?.stats || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    activeProjects: 0,
    teamMembers: 0,
    hoursLogged: 0,
    productivity: 0
  }

  const recentTasks = recentTasksData || []
  const activeProjects = activeProjectsData || []
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || []

  // Calculate productivity metrics
  const getProductivityTrend = () => {
    const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0
    return Math.round(completionRate)
  }

  const getEfficiencyScore = () => {
    // Calculate efficiency based on estimated vs actual hours
    if (stats.totalEstimatedHours > 0 && stats.totalActualHours > 0) {
      const efficiency = (stats.totalEstimatedHours / stats.totalActualHours) * 100
      return Math.min(100, Math.round(efficiency))
    }
    return 0
  }

  const getWeeklyProgress = () => {
    // Get weekly progress from dashboard data
    return dashboardData?.weeklyProgress || [
      { day: 'Mon', completed: 0, planned: 0 },
      { day: 'Tue', completed: 0, planned: 0 },
      { day: 'Wed', completed: 0, planned: 0 },
      { day: 'Thu', completed: 0, planned: 0 },
      { day: 'Fri', completed: 0, planned: 0 },
      { day: 'Sat', completed: 0, planned: 0 },
      { day: 'Sun', completed: 0, planned: 0 }
    ]
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success'
      case 'in-progress': return 'text-warning'
      case 'pending': return 'text-info'
      case 'overdue': return 'text-error'
      default: return 'text-base-content'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'badge-error'
      case 'medium': return 'badge-warning'
      case 'low': return 'badge-info'
      default: return 'badge-ghost'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-content rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">
                {getGreeting()}, {user?.name}!
              </h1>
              <p className="opacity-90 mb-4">
                You have {stats.pendingTasks} pending tasks and {stats.overdueTasks} overdue items.
              </p>
              
              {/* Period Selector */}
              <div className="flex gap-2">
                {['today', 'week', 'month'].map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`btn btn-sm ${
                      selectedPeriod === period 
                        ? 'btn-primary-content bg-white/20' 
                        : 'btn-ghost text-primary-content/80 hover:bg-white/10'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold">{getProductivityTrend()}%</div>
                <div className="text-sm opacity-75">Completion Rate</div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">{getEfficiencyScore()}%</div>
                <div className="text-sm opacity-75">Efficiency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">+12% this {selectedPeriod}</span>
                  </div>
                </div>
                <div className="relative">
                  <CheckSquare className="w-8 h-8 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-success">{stats.completedTasks}</p>
                  <div className="w-full bg-base-300 rounded-full h-1 mt-2">
                    <div 
                      className="bg-success h-1 rounded-full transition-all duration-500"
                      style={{ width: `${getProductivityTrend()}%` }}
                    ></div>
                  </div>
                </div>
                <Target className="w-8 h-8 text-success" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="w-3 h-3 text-warning" />
                    <span className="text-xs text-base-content/60">{activeProjects.length} in progress</span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-info" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Hours Logged</p>
                  <p className="text-2xl font-bold">{stats.hoursLogged}h</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Timer className="w-3 h-3 text-info" />
                    <span className="text-xs text-base-content/60">Avg: {Math.round(stats.hoursLogged / 7)}h/day</span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-lg">
                <BarChart3 className="w-5 h-5" />
                Weekly Progress
              </h2>
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-base-300 rounded"></div>
                  <span>Planned</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 h-32">
              {getWeeklyProgress().map((day, index) => {
                const maxHeight = Math.max(...getWeeklyProgress().map(d => d.planned))
                const completedHeight = (day.completed / maxHeight) * 100
                const plannedHeight = (day.planned / maxHeight) * 100
                
                return (
                  <div key={day.day} className="flex flex-col items-center gap-2">
                    <div className="flex-1 flex flex-col justify-end relative w-8">
                      <div 
                        className="bg-base-300 rounded-t w-full transition-all duration-500"
                        style={{ height: `${plannedHeight}%` }}
                      ></div>
                      <div 
                        className="bg-primary rounded-t w-full absolute bottom-0 transition-all duration-700"
                        style={{ height: `${completedHeight}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{day.day}</span>
                    <span className="text-xs text-base-content/60">{day.completed}/{day.planned}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Active Projects Section */}
        {activeProjects.length > 0 && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">
                  <Award className="w-5 h-5" />
                  Active Projects
                </h2>
                <button 
                  onClick={() => navigate('/projects')}
                  className="btn btn-ghost btn-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeProjects.map((project) => {
                  const progress = project.tasks ? 
                    Math.round((project.tasks.filter(t => t.status === 'completed').length / project.tasks.length) * 100) : 0
                  
                  return (
                    <div 
                      key={project._id}
                      className="p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${project._id}`)}
                    >
                      <h3 className="font-semibold mb-2">{project.name}</h3>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-base-content/60">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-base-content/60">
                        <span>{project.tasks?.length || 0} tasks</span>
                        <span>{project.members?.length || 0} members</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">Recent Tasks</h2>
                  <button 
                    onClick={() => navigate('/tasks')}
                    className="btn btn-ghost btn-sm"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-base-content/60">{task.project}</span>
                          <span className={`badge badge-sm ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-base-content/60">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <button 
                    onClick={() => navigate('/tasks/new')}
                    className="btn btn-primary btn-sm w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Task
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-base mb-4">
                  <AlertCircle className="w-5 h-5" />
                  Upcoming Deadlines
                </h2>
                
                <div className="space-y-3">
                  {upcomingDeadlines.map((item) => (
                    <div key={item.id} className="p-3 bg-base-200 rounded-lg">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-base-content/60">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        <span className={`badge badge-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-base mb-4">Quick Actions</h2>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/tasks/new')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </button>
                  
                  <button 
                    onClick={() => navigate('/projects/new')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </button>
                  
                  <button 
                    onClick={() => navigate('/time')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Time Tracking
                  </button>
                  
                  <button 
                    onClick={() => navigate('/calendar')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
