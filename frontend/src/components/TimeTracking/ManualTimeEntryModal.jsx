import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  X,
  Clock,
  Calendar,
  FileText,
  Save
} from 'lucide-react'

const schema = yup.object({
  task: yup.string().required('Task is required'),
  project: yup.string().required('Project is required'),
  date: yup.date().required('Date is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  description: yup.string().max(500, 'Description too long')
})

const ManualTimeEntryModal = ({ isOpen, onClose, onSave, availableTasks }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      task: '',
      project: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      description: ''
    }
  })

  const watchTask = watch('task')
  const selectedTask = availableTasks.find(t => t.id.toString() === watchTask)

  const onSubmit = (data) => {
    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`)
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`)
      
      // If end time is before start time, assume it's the next day
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1)
      }

      const duration = Math.round((endDateTime - startDateTime) / (1000 * 60)) // minutes

      const entryData = {
        task: selectedTask?.title || data.task,
        project: selectedTask?.project || data.project,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: duration,
        description: data.description
      }

      onSave(entryData)
      reset()
    } catch (error) {
      console.error('Error creating manual entry:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Add Manual Time Entry</h2>
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Task Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Task *</span>
              </label>
              <select 
                {...register('task')}
                className={`select select-bordered ${errors.task ? 'select-error' : ''}`}
                onChange={(e) => {
                  const task = availableTasks.find(t => t.id.toString() === e.target.value)
                  if (task) {
                    // Auto-fill project when task is selected
                    register('project').onChange({ target: { value: task.project } })
                  }
                }}
              >
                <option value="">Select a task...</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {errors.task && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.task.message}</span>
                </label>
              )}
            </div>

            {/* Project */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Project *</span>
              </label>
              <input
                {...register('project')}
                type="text"
                placeholder="Enter project name"
                className={`input input-bordered ${errors.project ? 'input-error' : ''}`}
                value={selectedTask?.project || ''}
                readOnly={!!selectedTask}
              />
              {errors.project && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.project.message}</span>
                </label>
              )}
            </div>

            {/* Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date *</span>
              </label>
              <div className="relative">
                <input
                  {...register('date')}
                  type="date"
                  className={`input input-bordered w-full pl-10 ${errors.date ? 'input-error' : ''}`}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
              </div>
              {errors.date && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.date.message}</span>
                </label>
              )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Start Time *</span>
                </label>
                <div className="relative">
                  <input
                    {...register('startTime')}
                    type="time"
                    className={`input input-bordered w-full pl-10 ${errors.startTime ? 'input-error' : ''}`}
                  />
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                </div>
                {errors.startTime && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.startTime.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">End Time *</span>
                </label>
                <div className="relative">
                  <input
                    {...register('endTime')}
                    type="time"
                    className={`input input-bordered w-full pl-10 ${errors.endTime ? 'input-error' : ''}`}
                  />
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                </div>
                {errors.endTime && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.endTime.message}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <div className="relative">
                <textarea
                  {...register('description')}
                  placeholder="What did you work on?"
                  className="textarea textarea-bordered w-full pl-10 pt-10 min-h-20"
                />
                <FileText className="absolute left-3 top-3 w-4 h-4 text-base-content/40" />
              </div>
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.description.message}</span>
                </label>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ManualTimeEntryModal