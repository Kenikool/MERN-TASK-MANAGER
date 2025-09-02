import React, { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  MoreHorizontal,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Eye,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react'
import { tasksAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const KanbanBoard = ({ tasks = [], onTaskClick, onTaskUpdate, onTaskDelete }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [showAddTask, setShowAddTask] = useState(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'bg-base-content/10',
      textColor: 'text-base-content',
      icon: Circle
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-warning/10',
      textColor: 'text-warning',
      icon: Clock
    },
    {
      id: 'review',
      title: 'Review',
      color: 'bg-info/10',
      textColor: 'text-info',
      icon: Eye
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-success/10',
      textColor: 'text-success',
      icon: CheckCircle2
    }
  ]

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksAPI.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task status updated')
    },
    onError: () => {
      toast.error('Failed to update task status')
    }
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => tasksAPI.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task created successfully')
      setNewTaskTitle('')
      setShowAddTask(null)
    },
    onError: () => {
      toast.error('Failed to create task')
    }
  })

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedTask && draggedTask.status !== columnId) {
      updateTaskMutation.mutate({
        taskId: draggedTask._id,
        status: columnId
      })
    }
    setDraggedTask(null)
  }

  const handleAddTask = (status) => {
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate({
        title: newTaskTitle.trim(),
        status: status,
        priority: 'medium'
      })
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-error'
      case 'high': return 'border-l-warning'
      case 'medium': return 'border-l-info'
      case 'low': return 'border-l-success'
      default: return 'border-l-base-300'
    }
  }

  const formatDate = (date) => {
    if (!date) return null
    const taskDate = new Date(date)
    const today = new Date()
    const diffTime = taskDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-error' }
    if (diffDays === 0) return { text: 'Today', color: 'text-warning' }
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-info' }
    return { text: `${diffDays} days`, color: 'text-base-content/60' }
  }

  const TaskCard = ({ task }) => {
    const dueDate = formatDate(task.dueDate)
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        className={`card bg-base-100 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${getPriorityColor(task.priority)} ${
          draggedTask?._id === task._id ? 'opacity-50 rotate-2' : ''
        }`}
        onClick={() => onTaskClick?.(task._id)}
      >
        <div className="card-body p-4">
          {/* Task Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {task.title}
            </h3>
            <div className="dropdown dropdown-end">
              <button 
                className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48">
                <li>
                  <button onClick={(e) => {
                    e.stopPropagation()
                    onTaskClick?.(task._id)
                  }}>
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </li>
                <li>
                  <button onClick={(e) => {
                    e.stopPropagation()
                    // Handle edit
                  }}>
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </li>
                <li>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskDelete?.(task._id)
                    }}
                    className="text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Task Description */}
          {task.description && (
            <p className="text-xs text-base-content/70 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Task Meta */}
          <div className="space-y-2">
            {/* Priority & Due Date */}
            <div className="flex items-center justify-between text-xs">
              <span className={`badge badge-xs ${
                task.priority === 'urgent' ? 'badge-error' :
                task.priority === 'high' ? 'badge-warning' :
                task.priority === 'medium' ? 'badge-info' : 'badge-success'
              }`}>
                {task.priority}
              </span>
              
              {dueDate && (
                <div className={`flex items-center gap-1 ${dueDate.color}`}>
                  <Calendar className="w-3 h-3" />
                  <span>{dueDate.text}</span>
                  {isOverdue && <AlertCircle className="w-3 h-3" />}
                </div>
              )}
            </div>

            {/* Assignee */}
            {task.assignedTo && (
              <div className="flex items-center gap-2">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-6">
                    <span className="text-xs">
                      {task.assignedTo.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-base-content/70 truncate">
                  {task.assignedTo.name}
                </span>
              </div>
            )}

            {/* Progress Indicators */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3 h-3 text-success" />
                <span className="text-base-content/60">
                  {task.checklist.filter(item => item.completed).length}/{task.checklist.length}
                </span>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="badge badge-outline badge-xs">
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="badge badge-ghost badge-xs">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const AddTaskForm = ({ status, onCancel }) => (
    <div className="card bg-base-100 shadow-sm border-2 border-dashed border-primary">
      <div className="card-body p-4">
        <input
          type="text"
          placeholder="Enter task title..."
          className="input input-bordered input-sm w-full"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddTask(status)
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAddTask(status)}
            className="btn btn-primary btn-xs"
            disabled={!newTaskTitle.trim() || createTaskMutation.isLoading}
          >
            {createTaskMutation.isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              'Add Task'
            )}
          </button>
          <button
            onClick={onCancel}
            className="btn btn-ghost btn-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
      {columns.map(column => {
        const columnTasks = getTasksByStatus(column.id)
        const Icon = column.icon

        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-80 ${column.color} rounded-lg p-4 ${
              dragOverColumn === column.id ? 'ring-2 ring-primary ring-opacity-50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${column.textColor}`} />
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <span className="badge badge-sm">{columnTasks.length}</span>
              </div>
              
              <button
                onClick={() => setShowAddTask(column.id)}
                className="btn btn-ghost btn-sm btn-circle"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="space-y-3 min-h-[500px]">
              {/* Add Task Form */}
              {showAddTask === column.id && (
                <AddTaskForm
                  status={column.id}
                  onCancel={() => {
                    setShowAddTask(null)
                    setNewTaskTitle('')
                  }}
                />
              )}

              {/* Task Cards */}
              {columnTasks.map(task => (
                <div key={task._id} className="group">
                  <TaskCard task={task} />
                </div>
              ))}

              {/* Empty State */}
              {columnTasks.length === 0 && showAddTask !== column.id && (
                <div className="text-center py-8 text-base-content/40">
                  <Icon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">No tasks</p>
                  <button
                    onClick={() => setShowAddTask(column.id)}
                    className="btn btn-ghost btn-sm mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </button>
                </div>
              )}

              {/* Drop Zone Indicator */}
              {draggedTask && dragOverColumn === column.id && draggedTask.status !== column.id && (
                <div className="border-2 border-dashed border-primary rounded-lg p-4 text-center text-primary">
                  <GripVertical className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">Drop task here</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard