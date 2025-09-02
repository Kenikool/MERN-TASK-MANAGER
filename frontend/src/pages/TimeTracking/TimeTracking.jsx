import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Play,
  Square,
  Clock,
  Calendar,
  Plus,
  Filter,
  Download,
  BarChart3,
  Timer,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Pause
} from 'lucide-react'
import { useSubscription } from '../../context/SubscriptionContext'
import FeatureGate from '../../components/Common/FeatureGate'
import ManualTimeEntryModal from '../../components/TimeTracking/ManualTimeEntryModal'
import toast from 'react-hot-toast'

const TimeTracking = () => {
  const { hasFeature } = useSubscription()
  const [activeTimer, setActiveTimer] = useState(null)
  const [selectedTask, setSelectedTask] = useState('')
  const [currentTime, setCurrentTime] = useState(0) // seconds
  const [isPaused, setIsPaused] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [timeEntries, setTimeEntries] = useState([
    {
      id: 1,
      task: 'Update user interface design',
      project: 'Mobile App',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      duration: 90, // minutes
      description: 'Working on the new dashboard layout'
    },
    {
      id: 2,
      task: 'Database optimization',
      project: 'Backend API',
      startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      duration: 150, // minutes
      description: 'Optimizing query performance'
    }
  ])

  const [dateFilter, setDateFilter] = useState('today')

  // Mock tasks for timer
  const availableTasks = [
    { id: 1, title: 'Update user interface design', project: 'Mobile App' },
    { id: 2, title: 'Database optimization', project: 'Backend API' },
    { id: 3, title: 'User testing session', project: 'UX Research' },
    { id: 4, title: 'Code review', project: 'Frontend' }
  ]

  // Real-time timer effect
  useEffect(() => {
    let interval = null
    if (activeTimer && !isPaused) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1)
      }, 1000)
    } else if (!activeTimer) {
      setCurrentTime(0)
    }
    return () => clearInterval(interval)
  }, [activeTimer, isPaused])

  // Load active timer from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem('activeTimer')
    if (savedTimer) {
      const timer = JSON.parse(savedTimer)
      const elapsed = Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000)
      setActiveTimer(timer)
      setCurrentTime(elapsed)
      setSelectedTask(timer.taskId.toString())
    }
  }, [])

  // Save active timer to localStorage
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('activeTimer', JSON.stringify(activeTimer))
    } else {
      localStorage.removeItem('activeTimer')
    }
  }, [activeTimer])

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimerDisplay = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalTime = () => {
    return timeEntries.reduce((total, entry) => total + entry.duration, 0)
  }

  const getAverageTime = () => {
    if (timeEntries.length === 0) return 0
    return Math.round(getTotalTime() / timeEntries.length)
  }

  const getTodayTime = () => {
    const today = new Date().toDateString()
    return timeEntries
      .filter(entry => new Date(entry.startTime).toDateString() === today)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const getThisWeekTime = () => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    return timeEntries
      .filter(entry => new Date(entry.startTime) >= startOfWeek)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const handleStartTimer = () => {
    if (!selectedTask) {
      toast.error('Please select a task first')
      return
    }
    
    const task = availableTasks.find(t => t.id.toString() === selectedTask)
    const timer = {
      taskId: selectedTask,
      taskTitle: task.title,
      project: task.project,
      startTime: new Date().toISOString()
    }
    
    setActiveTimer(timer)
    setCurrentTime(0)
    setIsPaused(false)
    toast.success('Timer started!')
  }

  const handlePauseTimer = () => {
    setIsPaused(!isPaused)
    toast.info(isPaused ? 'Timer resumed' : 'Timer paused')
  }

  const handleStopTimer = () => {
    if (activeTimer) {
      const duration = Math.round(currentTime / 60) // convert to minutes
      
      const newEntry = {
        id: Date.now(),
        task: activeTimer.taskTitle,
        project: activeTimer.project,
        startTime: activeTimer.startTime,
        endTime: new Date().toISOString(),
        duration: duration,
        description: ''
      }
      
      setTimeEntries([newEntry, ...timeEntries])
      setActiveTimer(null)
      setCurrentTime(0)
      setIsPaused(false)
      toast.success(`Time logged: ${formatDuration(duration)}`)
    }
  }

  const handleAddManualEntry = (entryData) => {
    const newEntry = {
      id: Date.now(),
      ...entryData
    }
    setTimeEntries([newEntry, ...timeEntries])
    setShowManualEntry(false)
    toast.success('Manual entry added successfully')
  }

  const handleDeleteEntry = (entryId) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== entryId))
    toast.success('Time entry deleted')
  }

  const handleExportData = () => {
    const csvContent = [
      ['Task', 'Project', 'Date', 'Start Time', 'End Time', 'Duration (minutes)', 'Description'],
      ...timeEntries.map(entry => [
        entry.task,
        entry.project,
        formatDate(entry.startTime),
        formatTime(entry.startTime),
        formatTime(entry.endTime),
        entry.duration,
        entry.description
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  if (!hasFeature('timeTracking')) {
    return (
      <FeatureGate 
        feature="timeTracking" 
        requiredPlan="basic"
        className="min-h-[60vh]"
      />
    )
  }

  return (
    <>
      <Helmet>
        <title>Time Tracking - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Time Tracking</h1>
            <p className="text-base-content/60">
              Track time spent on tasks and analyze productivity
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowManualEntry(true)}
              className="btn btn-outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </button>
            <button 
              onClick={handleExportData}
              className="btn btn-outline"
              disabled={timeEntries.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Today</p>
                  <p className="text-2xl font-bold">{formatDuration(getTodayTime())}</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">This Week</p>
                  <p className="text-2xl font-bold">{formatDuration(getThisWeekTime())}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Total Entries</p>
                  <p className="text-2xl font-bold">{timeEntries.length}</p>
                </div>
                <Target className="w-8 h-8 text-info" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Average</p>
                  <p className="text-2xl font-bold">{formatDuration(getAverageTime())}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Timer Section */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Timer className="w-5 h-5" />
              Time Tracker
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timer Controls */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Select Task</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    disabled={activeTimer}
                  >
                    <option value="">Choose a task...</option>
                    {availableTasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title} - {task.project}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  {!activeTimer ? (
                    <button 
                      onClick={handleStartTimer}
                      className="btn btn-primary"
                      disabled={!selectedTask}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Timer
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handlePauseTimer}
                        className={`btn ${isPaused ? 'btn-warning' : 'btn-secondary'}`}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button 
                        onClick={handleStopTimer}
                        className="btn btn-error"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop & Save
                      </button>
                    </>
                  )}\n                </div>

                {activeTimer && (
                  <div className="alert alert-info">
                    <Timer className="w-4 h-4" />
                    <span>
                      Tracking: <strong>{activeTimer.taskTitle}</strong>
                      {isPaused && <span className="text-warning ml-2">(Paused)</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Active Timer Display */}
              <div className="flex items-center justify-center">
                {activeTimer ? (
                  <div className="text-center">
                    <div className={`text-6xl font-mono font-bold mb-4 ${
                      isPaused ? 'text-warning' : 'text-primary'
                    }`}>
                      {formatTimerDisplay(currentTime)}
                    </div>
                    <p className="text-base-content/60 mb-2">
                      Working on: {activeTimer.taskTitle}
                    </p>
                    <p className="text-sm text-base-content/40">
                      Started: {formatTime(activeTimer.startTime)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-base-content/40">
                    <Clock className="w-16 h-16 mx-auto mb-4" />
                    <p>No active timer</p>
                    <p className="text-sm">Select a task and start tracking time</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="form-control">
                <select 
                  className="select select-bordered select-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this-week">This Week</option>
                  <option value="last-week">Last Week</option>
                  <option value="this-month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <button className="btn btn-outline btn-sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Time Entries */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Time Entries</h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Duration</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map(entry => (
                    <tr key={entry.id} className="hover">
                      <td className="font-medium">{entry.task}</td>
                      <td>
                        <span className="badge badge-outline badge-sm">
                          {entry.project}
                        </span>
                      </td>
                      <td>{formatDate(entry.startTime)}</td>
                      <td>{formatTime(entry.startTime)}</td>
                      <td>{formatTime(entry.endTime)}</td>
                      <td>
                        <span className="font-mono font-semibold">
                          {formatDuration(entry.duration)}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {entry.description || 'No description'}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={() => {/* Edit functionality */}}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {timeEntries.length === 0 && (
              <div className="text-center py-8 text-base-content/60">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No time entries yet</p>
                <p className="text-sm">Start tracking time to see entries here</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">
              <Calendar className="w-5 h-5" />
              Weekly Overview
            </h2>
            
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                const dayTime = Math.floor(Math.random() * 480) // Mock data
                const maxTime = 480 // 8 hours
                const percentage = (dayTime / maxTime) * 100
                
                return (
                  <div key={day} className="text-center">
                    <div className="text-xs font-medium mb-2">{day}</div>
                    <div className="h-24 bg-base-200 rounded relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 w-full bg-primary transition-all duration-500"
                        style={{ height: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1 text-base-content/60">
                      {formatDuration(dayTime)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Time Entry Modal */}
      <ManualTimeEntryModal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSave={handleAddManualEntry}
        availableTasks={availableTasks}
      />
    </>
  )
}

export default TimeTracking