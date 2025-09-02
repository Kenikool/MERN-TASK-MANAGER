import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  AlertCircle,
  Save
} from 'lucide-react'

const schema = yup.object({
  title: yup.string().required('Event title is required').max(100, 'Title too long'),
  description: yup.string().max(500, 'Description too long'),
  type: yup.string().required('Event type is required'),
  date: yup.date().required('Date is required'),
  startTime: yup.string(),
  endTime: yup.string(),
  location: yup.string().max(100, 'Location too long'),
  attendees: yup.string(),
  allDay: yup.boolean(),
  priority: yup.string()
})

const CreateEventModal = ({ isOpen, onClose, onSave, event = null }) => {
  const [isAllDay, setIsAllDay] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      type: 'meeting',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      attendees: '',
      allDay: false,
      priority: 'medium'
    }
  })

  const watchAllDay = watch('allDay')

  useEffect(() => {
    setIsAllDay(watchAllDay)
  }, [watchAllDay])

  useEffect(() => {
    if (event) {
      // Populate form with event data for editing
      const eventDate = new Date(event.date)
      reset({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'meeting',
        date: eventDate.toISOString().split('T')[0],
        startTime: event.allDay ? '09:00' : eventDate.toTimeString().slice(0, 5),
        endTime: event.endDate ? new Date(event.endDate).toTimeString().slice(0, 5) : '10:00',
        location: event.location || '',
        attendees: event.attendees ? event.attendees.join(', ') : '',
        allDay: event.allDay || false,
        priority: event.priority || 'medium'
      })
      setIsAllDay(event.allDay || false)
    } else {
      // Reset form for new event
      reset({
        title: '',
        description: '',
        type: 'meeting',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        attendees: '',
        allDay: false,
        priority: 'medium'
      })
      setIsAllDay(false)
    }
  }, [event, reset])

  const onSubmit = (data) => {
    try {
      const eventDate = new Date(data.date)
      
      let startDateTime, endDateTime

      if (data.allDay) {
        startDateTime = new Date(eventDate.setHours(0, 0, 0, 0))
        endDateTime = new Date(eventDate.setHours(23, 59, 59, 999))
      } else {
        const [startHour, startMinute] = data.startTime.split(':')
        const [endHour, endMinute] = data.endTime.split(':')
        
        startDateTime = new Date(eventDate)
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
        
        endDateTime = new Date(eventDate)
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
        
        // If end time is before start time, assume it's the next day
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1)
        }
      }

      const eventData = {
        title: data.title,
        description: data.description,
        type: data.type,
        date: startDateTime,
        endDate: endDateTime,
        location: data.location,
        attendees: data.attendees ? data.attendees.split(',').map(a => a.trim()).filter(a => a) : [],
        allDay: data.allDay,
        priority: data.priority
      }

      onSave(eventData)
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  if (!isOpen) return null

  const eventTypes = [
    { value: 'meeting', label: 'Meeting', color: 'text-blue-500' },
    { value: 'task', label: 'Task', color: 'text-green-500' },
    { value: 'deadline', label: 'Deadline', color: 'text-red-500' },
    { value: 'personal', label: 'Personal', color: 'text-purple-500' }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { value: 'high', label: 'High', color: 'text-red-500' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Event Title *</span>
              </label>
              <input
                {...register('title')}
                type="text"
                placeholder="Enter event title"
                className={`input input-bordered ${errors.title ? 'input-error' : ''}`}
              />
              {errors.title && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.title.message}</span>
                </label>
              )}
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Event Type *</span>
                </label>
                <select {...register('type')} className="select select-bordered">
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Priority</span>
                </label>
                <select {...register('priority')} className="select select-bordered">
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
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

              {/* All Day Toggle */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    {...register('allDay')}
                    type="checkbox"
                    className="checkbox"
                  />
                  <span className="label-text">All day event</span>
                </label>
              </div>

              {/* Time inputs - only show if not all day */}
              {!isAllDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Start Time</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('startTime')}
                        type="time"
                        className="input input-bordered w-full pl-10"
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">End Time</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('endTime')}
                        type="time"
                        className="input input-bordered w-full pl-10"
                      />
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Location</span>
              </label>
              <div className="relative">
                <input
                  {...register('location')}
                  type="text"
                  placeholder="Enter location or meeting link"
                  className="input input-bordered w-full pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
              </div>
            </div>

            {/* Attendees */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Attendees</span>
              </label>
              <div className="relative">
                <input
                  {...register('attendees')}
                  type="text"
                  placeholder="Enter attendee names separated by commas"
                  className="input input-bordered w-full pl-10"
                />
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
              </div>
              <label className="label">
                <span className="label-text-alt">Separate multiple attendees with commas</span>
              </label>
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <div className="relative">
                <textarea
                  {...register('description')}
                  placeholder="Enter event description"
                  className="textarea textarea-bordered w-full pl-10 pt-10 min-h-24"
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
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
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
                    {event ? 'Update Event' : 'Create Event'}
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

export default CreateEventModal