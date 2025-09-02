import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  X,
  Edit,
  Trash2
} from 'lucide-react'
import CreateEventModal from '../../components/Calendar/CreateEventModal'
import toast from 'react-hot-toast'

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'day'
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({
    tasks: true,
    meetings: true,
    deadlines: true,
    personal: false
  })

  // Mock events data with current dates
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Team Standup',
      type: 'meeting',
      date: new Date(new Date().setHours(9, 0, 0, 0)),
      endDate: new Date(new Date().setHours(9, 30, 0, 0)),
      description: 'Daily team synchronization',
      attendees: ['John Doe', 'Jane Smith'],
      location: 'Conference Room A'
    },
    {
      id: 2,
      title: 'Project Alpha Deadline',
      type: 'deadline',
      date: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
      allDay: true,
      description: 'Final submission for Project Alpha',
      priority: 'high'
    },
    {
      id: 3,
      title: 'UI Design Review',
      type: 'task',
      date: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      description: 'Review new dashboard designs',
      assignee: 'Design Team'
    }
  ])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayNamesShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const getEventColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500'
      case 'deadline': return 'bg-red-500'
      case 'task': return 'bg-green-500'
      case 'personal': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get days for month view
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  // Get week days for week view
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  }

  // Get hours for day/week view
  const getHours = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    return hours
  }

  const getEventsForDate = (date) => {
    if (!date) return []
    
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString() &&
             selectedFilters[event.type]
    })
  }

  const getEventsForHour = (date, hour) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString() &&
             eventDate.getHours() === hour &&
             selectedFilters[event.type] &&
             !event.allDay
    })
  }

  const navigate = (direction) => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction)
        break
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7))
        break
      case 'day':
        newDate.setDate(currentDate.getDate() + direction)
        break
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleCreateEvent = () => {
    setShowCreateModal(true)
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  const handleEventSave = (eventData) => {
    if (selectedEvent) {
      // Update existing event
      setEvents(prev => prev.map(e => 
        e.id === selectedEvent.id ? { ...eventData, id: selectedEvent.id } : e
      ))
      toast.success('Event updated successfully')
    } else {
      // Create new event
      const newEvent = {
        ...eventData,
        id: Date.now()
      }
      setEvents(prev => [...prev, newEvent])
      toast.success('Event created successfully')
    }
    setShowCreateModal(false)
    setSelectedEvent(null)
  }

  const handleEventDelete = (eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
    setSelectedEvent(null)
    toast.success('Event deleted successfully')
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date) => {
    if (!date) return false
    return date.getMonth() === currentDate.getMonth()
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      case 'week':
        const weekDays = getWeekDays(currentDate)
        const start = weekDays[0]
        const end = weekDays[6]
        if (start.getMonth() === end.getMonth()) {
          return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
        } else {
          return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
        }
      case 'day':
        return formatDate(currentDate)
      default:
        return ''
    }
  }

  return (
    <>
      <Helmet>
        <title>Calendar - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-base-content/60">
              View and manage your schedule, tasks, and deadlines
            </p>
          </div>
          
          <button 
            onClick={handleCreateEvent}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </button>
        </div>

        {/* Calendar Controls */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Navigation */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(-1)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <h2 className="text-xl font-semibold min-w-64 text-center">
                    {getViewTitle()}
                  </h2>
                  
                  <button 
                    onClick={() => navigate(1)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={goToToday}
                  className="btn btn-outline btn-sm"
                >
                  Today
                </button>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-4">
                {/* View Mode */}
                <div className="join">
                  <button 
                    className={`btn join-item btn-sm ${viewMode === 'month' ? 'btn-active' : 'btn-outline'}`}
                    onClick={() => setViewMode('month')}
                  >
                    Month
                  </button>
                  <button 
                    className={`btn join-item btn-sm ${viewMode === 'week' ? 'btn-active' : 'btn-outline'}`}
                    onClick={() => setViewMode('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`btn join-item btn-sm ${viewMode === 'day' ? 'btn-active' : 'btn-outline'}`}
                    onClick={() => setViewMode('day')}
                  >
                    Day
                  </button>
                </div>

                {/* Filters */}
                <button 
                  className={`btn btn-outline btn-sm ${showFilters ? 'btn-active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-base-300">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(selectedFilters).map(([key, value]) => (
                    <label key={key} className="label cursor-pointer gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={value}
                        onChange={(e) => setSelectedFilters(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                      />
                      <span className="label-text capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Views */}
        {viewMode === 'month' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-base-300">
                {dayNames.map(day => (
                  <div key={day} className="p-4 text-center font-semibold text-base-content/80 border-r border-base-300 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {getDaysInMonth(currentDate).map((date, index) => {
                  const dayEvents = getEventsForDate(date)
                  
                  return (
                    <div 
                      key={index}
                      className={`min-h-32 p-2 border-r border-b border-base-300 last:border-r-0 cursor-pointer hover:bg-base-50 ${
                        !isCurrentMonth(date) ? 'bg-base-200/50' : ''
                      } ${isToday(date) ? 'bg-primary/5' : ''}`}
                      onClick={() => date && handleCreateEvent()}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-medium mb-2 ${
                            isToday(date) ? 'text-primary font-bold' : 
                            !isCurrentMonth(date) ? 'text-base-content/40' : 'text-base-content'
                          }`}>
                            {date.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map(event => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded cursor-pointer ${getEventColor(event.type)} text-white`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                              >
                                <div className="truncate font-medium">{event.title}</div>
                                {!event.allDay && (
                                  <div className="opacity-90">{formatTime(event.date)}</div>
                                )}
                              </div>
                            ))}
                            
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-base-content/60 font-medium">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b border-base-300">
                <div className="p-4 border-r border-base-300"></div>
                {getWeekDays(currentDate).map((date, index) => (
                  <div key={index} className="p-4 text-center border-r border-base-300 last:border-r-0">
                    <div className="font-semibold">{dayNamesShort[index]}</div>
                    <div className={`text-lg ${isToday(date) ? 'text-primary font-bold' : ''}`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Week Grid */}
              <div className="max-h-96 overflow-y-auto">
                {getHours().map(hour => (
                  <div key={hour} className="grid grid-cols-8 border-b border-base-300">
                    <div className="p-2 text-xs text-base-content/60 border-r border-base-300 text-center">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                    {getWeekDays(currentDate).map((date, dayIndex) => {
                      const hourEvents = getEventsForHour(date, hour)
                      return (
                        <div 
                          key={dayIndex} 
                          className="min-h-12 p-1 border-r border-base-300 last:border-r-0 cursor-pointer hover:bg-base-50"
                          onClick={() => handleCreateEvent()}
                        >
                          {hourEvents.map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded mb-1 cursor-pointer ${getEventColor(event.type)} text-white`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventClick(event)
                              }}
                            >
                              <div className="truncate font-medium">{event.title}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              {/* Day Header */}
              <div className="p-4 border-b border-base-300 text-center">
                <h3 className="text-lg font-semibold">{formatDate(currentDate)}</h3>
              </div>

              {/* Day Grid */}
              <div className="max-h-96 overflow-y-auto">
                {getHours().map(hour => {
                  const hourEvents = getEventsForHour(currentDate, hour)
                  return (
                    <div key={hour} className="flex border-b border-base-300">
                      <div className="w-20 p-2 text-xs text-base-content/60 border-r border-base-300 text-center">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </div>
                      <div 
                        className="flex-1 min-h-12 p-2 cursor-pointer hover:bg-base-50"
                        onClick={() => handleCreateEvent()}
                      >
                        {hourEvents.map(event => (
                          <div
                            key={event.id}
                            className={`text-sm p-2 rounded mb-2 cursor-pointer ${getEventColor(event.type)} text-white`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs opacity-90">
                              {formatTime(event.date)} - {event.endDate && formatTime(event.endDate)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Upcoming Events</h2>
            
            <div className="space-y-3">
              {events
                .filter(event => new Date(event.date) >= new Date() && selectedFilters[event.type])
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5)
                .map(event => (
                  <div 
                    key={event.id}
                    className="flex items-center gap-4 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`}></div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-base-content/60 mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{event.date.toLocaleDateString()}</span>
                        </div>
                        
                        {!event.allDay && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(event.date)}</span>
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.attendees && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {event.priority === 'high' && (
                      <AlertCircle className="w-4 h-4 text-error" />
                    )}
                  </div>
                ))}
            </div>

            {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-base-content/60">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming events</p>
                <p className="text-sm">Create an event to see it here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedEvent(null)
        }}
        onSave={handleEventSave}
        event={selectedEvent}
      />

      {/* Event Details Modal */}
      {selectedEvent && !showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(true)
                    }}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEventDelete(selectedEvent.id)}
                    className="btn btn-ghost btn-sm btn-circle text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-base-content/60" />
                  <span>{selectedEvent.date.toLocaleDateString()}</span>
                </div>

                {!selectedEvent.allDay && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-base-content/60" />
                    <span>
                      {formatTime(selectedEvent.date)}
                      {selectedEvent.endDate && ` - ${formatTime(selectedEvent.endDate)}`}
                    </span>
                  </div>
                )}

                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-base-content/60" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.attendees && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-base-content/60" />
                    <span>{selectedEvent.attendees.join(', ')}</span>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-base-content/70">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Calendar