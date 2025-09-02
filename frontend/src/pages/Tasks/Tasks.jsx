import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users
} from 'lucide-react'
import { tasksAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const Tasks = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list', 'kanban'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch tasks
  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', { status: statusFilter, priority: priorityFilter, assignee: assigneeFilter, search: searchTerm }],
    queryFn: () => tasksAPI.getTasks({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      assignedTo: assigneeFilter !== 'all' ? assigneeFilter : undefined,
      search: searchTerm || undefined,
    }),
    select: (data) => data.data
  })

  const tasks = tasksData?.tasks || []

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [tasks, searchTerm])

  // Group tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    const groups = {
      'todo': [],
      'in-progress': [],
      'review': [],
      'completed': []
    }
    
    filteredTasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task)
      }
    })
    
    return groups
  }, [filteredTasks])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success'
      case 'in-progress': return 'text-warning'
      case 'review': return 'text-info'
      case 'todo': return 'text-base-content'
      default: return 'text-base-content'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'in-progress': return <Clock className="w-4 h-4" />
      case 'review': return <Eye className="w-4 h-4" />
      case 'todo': return <Circle className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'badge-error'
      case 'high': return 'badge-warning'
      case 'medium': return 'badge-info'
      case 'low': return 'badge-success'
      default: return 'badge-ghost'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'No due date'
    const taskDate = new Date(date)
    const today = new Date()
    const diffTime = taskDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  const handleTaskClick = useCallback((taskId) => {
    navigate(`/tasks/${taskId}`)
  }, [navigate])

  const handleCreateTask = useCallback(() => {
    navigate('/tasks/new')
  }, [navigate])

  const handleDeleteTask = useCallback(async (taskId, e) => {
    e.stopPropagation()
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(taskId)
        toast.success('Task deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete task')
      }
    }
  }, [refetch])

  const handleStatusChange = useCallback(async (taskId, newStatus, e) => {
    e.stopPropagation()
    
    try {
      await tasksAPI.updateStatus(taskId, newStatus)
      toast.success('Task status updated')
      refetch()
    } catch (error) {
      toast.error('Failed to update task status')
    }
  }, [refetch])

  // Task Card Component
  const TaskCard = React.memo(({ task, className = '' }) => (
    <div 
      key={task._id}
      className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300 ${className}`}
      onClick={() => handleTaskClick(task._id)}
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="card-title text-base font-semibold line-clamp-2">
            {task.title}
          </h3>
          <div className="dropdown dropdown-end">
            <button 
              className="btn btn-ghost btn-xs btn-circle"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <button onClick={() => navigate(`/tasks/${task._id}/edit`)}>
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleDeleteTask(task._id, e)}
                  className="text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </li>
            </ul>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-base-content/70 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1 ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
            <span className="text-xs capitalize">{task.status.replace('-', ' ')}</span>
          </div>
          <span className={`badge badge-xs ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-base-content/60">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className={task.dueDate && new Date(task.dueDate) < new Date() ? 'text-error' : ''}>
              {formatDate(task.dueDate)}
            </span>
          </div>
          
          {task.assignedTo && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{task.assignedTo.name}</span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="badge badge-outline badge-xs">
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="badge badge-ghost badge-xs">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  ))

  // Kanban Column Component
  const KanbanColumn = React.memo(({ title, status, tasks, color }) => (
    <div className="flex-1 min-w-80">
      <div className="bg-base-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            {title}
            <span className="badge badge-sm">{tasks.length}</span>
          </h3>
        </div>
        
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-base-content/50">
              <Circle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load tasks</h3>
        <p className="text-base-content/60 mb-4">There was an error loading your tasks.</p>
        <button onClick={refetch} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Tasks - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-base-content/60">
              Manage and track your tasks efficiently
            </p>
          </div>
          
          <button 
            onClick={handleCreateTask}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>

        {/* Filters and Search */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="input input-bordered w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="join">
                <button 
                  className={`btn join-item btn-sm ${viewMode === 'grid' ? 'btn-active' : 'btn-outline'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button 
                  className={`btn join-item btn-sm ${viewMode === 'list' ? 'btn-active' : 'btn-outline'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  className={`btn join-item btn-sm ${viewMode === 'kanban' ? 'btn-active' : 'btn-outline'}`}
                  onClick={() => setViewMode('kanban')}
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button 
                className={`btn btn-outline btn-sm ${showFilters ? 'btn-active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-base-300">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select 
                    className="select select-bordered select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Priority</span>
                  </label>
                  <select 
                    className="select select-bordered select-sm"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Assignee</span>
                  </label>
                  <select 
                    className="select select-bordered select-sm"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                  >
                    <option value="all">All Assignees</option>
                    <option value={user.id}>My Tasks</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Content */}
        {viewMode === 'kanban' ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn 
              title="To Do" 
              status="todo" 
              tasks={tasksByStatus.todo}
              color="bg-base-content/20"
            />
            <KanbanColumn 
              title="In Progress" 
              status="in-progress" 
              tasks={tasksByStatus['in-progress']}
              color="bg-warning"
            />
            <KanbanColumn 
              title="Review" 
              status="review" 
              tasks={tasksByStatus.review}
              color="bg-info"
            />
            <KanbanColumn 
              title="Completed" 
              status="completed" 
              tasks={tasksByStatus.completed}
              color="bg-success"
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTasks.map(task => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr 
                      key={task._id} 
                      className="hover cursor-pointer"
                      onClick={() => handleTaskClick(task._id)}
                    >
                      <td>
                        <div>
                          <div className="font-semibold">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-base-content/60 line-clamp-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={`flex items-center gap-1 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="capitalize">{task.status.replace('-', ' ')}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                              <div className="bg-neutral text-neutral-content rounded-full w-8">
                                <span className="text-xs">
                                  {task.assignedTo.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-base-content/40">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={task.dueDate && new Date(task.dueDate) < new Date() ? 'text-error' : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/tasks/${task._id}/edit`)
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs text-error"
                            onClick={(e) => handleDeleteTask(task._id, e)}
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
          </div>
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-base-content/60 mb-6">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first task to get started'
              }
            </p>
            {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all') && (
              <button 
                onClick={handleCreateTask}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Tasks