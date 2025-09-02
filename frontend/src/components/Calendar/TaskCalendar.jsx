import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Download,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  MoreVertical
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, parseISO, addMonths, subMonths } from 'date-fns';

import { tasksAPI, projectsAPI } from '../../utils/api';
import { formatDate, isOverdue, getStatusColor, getPriorityColor, cn } from '../../utils/cn';
import CreateTaskModal from '../Tasks/CreateTaskModal';
import TaskQuickView from './TaskQuickView';

const TaskCalendar = ({ projectId = null, userId = null }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignedTo: [],
    projects: []
  });

  const queryClient = useQueryClient();

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    let start, end;

    switch (view) {
      case 'month':
        start = startOfWeek(startOfMonth(currentDate));
        end = endOfWeek(endOfMonth(currentDate));
        break;
      case 'week':
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
        break;
      case 'day':
        start = currentDate;
        end = currentDate;
        break;
      default:
        start = startOfWeek(startOfMonth(currentDate));
        end = endOfWeek(endOfMonth(currentDate));
    }

    return { start, end };
  }, [currentDate, view]);

  // Fetch tasks for the current date range
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['calendar-tasks', {
      project: projectId,
      user: userId,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      ...filters
    }],
    queryFn: () => tasksAPI.getTasks({
      project: projectId,
      assignedTo: userId,
      dueDateStart: dateRange.start.toISOString(),
      dueDateEnd: dateRange.end.toISOString(),
      status: filters.status.length ? filters.status : undefined,
      priority: filters.priority.length ? filters.priority : undefined,
      limit: 500
    }).then(res => res.data.data)
  });

  // Fetch projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getProjects({ limit: 100 }).then(res => res.data.data)
  });

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = {};
    
    tasks.forEach(task => {
      if (!task.dueDate) return;
      
      const dateKey = format(parseISO(task.dueDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    // Sort tasks within each date by priority and due time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        return new Date(a.dueDate) - new Date(b.dueDate); // Earlier time first
      });
    });

    return grouped;
  }, [tasks]);

  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        setCurrentDate(direction > 0 ? addMonths(newDate, 1) : subMonths(newDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(newDate, direction * 7));
        break;
      case 'day':
        setCurrentDate(addDays(newDate, direction));
        break;
    }
  }, [currentDate, view]);

  const handleDateClick = useCallback((date) => {
    setSelectedDate(date);
    setShowCreateTask(true);
  }, []);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  const getTasksForDate = useCallback((date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  }, [tasksByDate]);

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-base-300 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} className="p-3 text-center font-semibold bg-base-200 border-b border-base-300">
            {dayName}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map(day => {
          const dayTasks = getTasksForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday_ = isToday(day);
          const hasOverdue = dayTasks.some(task => isOverdue(task.dueDate, task.status));

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[120px] p-2 border-b border-r border-base-300 cursor-pointer hover:bg-base-50 transition-colors",
                !isCurrentMonth && "bg-base-100/50 text-base-content/50",
                isToday_ && "bg-primary/10 ring-1 ring-primary",
                hasOverdue && "bg-error/5"
              )}
              onClick={() => handleDateClick(day)}
            >
              <div className={cn(
                "text-sm font-medium mb-2 flex items-center justify-between",
                isToday_ && "text-primary font-bold"
              )}>
                <span>{format(day, 'd')}</span>
                {dayTasks.length > 0 && (
                  <span className="badge badge-xs badge-primary">
                    {dayTasks.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task._id}
                    className={cn(
                      "text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate",
                      getStatusColor(task.status),
                      isOverdue(task.dueDate, task.status) && "ring-1 ring-error"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                    title={task.title}
                  >
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        getPriorityColor(task.priority).replace('badge-', 'bg-')
                      )} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                ))}
                
                {dayTasks.length > 3 && (
                  <div className="text-xs text-base-content/60 text-center py-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <div className="grid grid-cols-7 gap-0 border border-base-300 rounded-lg overflow-hidden">
        {days.map(day => {
          const dayTasks = getTasksForDate(day);
          const isToday_ = isToday(day);

          return (
            <div key={day.toISOString()} className="flex flex-col">
              {/* Day header */}
              <div className={cn(
                "p-3 text-center border-b border-base-300",
                isToday_ ? "bg-primary text-primary-content" : "bg-base-200"
              )}>
                <div className="text-sm font-medium">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-bold">
                  {format(day, 'd')}
                </div>
              </div>
              
              {/* Tasks */}
              <div className="flex-1 p-2 space-y-2 min-h-[400px] border-r border-base-300 last:border-r-0">
                {dayTasks.map(task => (
                  <div
                    key={task._id}
                    className={cn(
                      "p-2 rounded cursor-pointer hover:opacity-80 text-sm",
                      getStatusColor(task.status),
                      isOverdue(task.dueDate, task.status) && "ring-1 ring-error"
                    )}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="font-medium mb-1 line-clamp-2">{task.title}</div>
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      <span className={cn("badge badge-xs", getPriorityColor(task.priority))}>
                        {task.priority}
                      </span>
                      {task.assignedTo && (
                        <span>{task.assignedTo.name}</span>
                      )}
                      <span>{format(parseISO(task.dueDate), 'HH:mm')}</span>
                    </div>
                  </div>
                ))}
                
                {dayTasks.length === 0 && (
                  <button
                    onClick={() => handleDateClick(day)}
                    className="w-full p-4 border-2 border-dashed border-base-300 rounded-lg text-base-content/60 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-xs">Add task</div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const isToday_ = isToday(currentDate);

    return (
      <div className="border border-base-300 rounded-lg overflow-hidden">
        {/* Day header */}
        <div className={cn(
          "p-4 text-center border-b border-base-300",
          isToday_ ? "bg-primary text-primary-content" : "bg-base-200"
        )}>
          <div className="text-lg font-medium">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        
        {/* Tasks */}
        <div className="p-4">
          {dayTasks.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="mb-4">No tasks scheduled for this day</p>
              <button
                onClick={() => handleDateClick(currentDate)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayTasks.map(task => (
                <div
                  key={task._id}
                  className={cn(
                    "card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                    isOverdue(task.dueDate, task.status) && "border-l-4 border-error"
                  )}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base-content mb-1">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-base-content/60 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("badge", getStatusColor(task.status))}>
                            {task.status.replace('-', ' ')}
                          </span>
                          <span className={cn("badge badge-outline", getPriorityColor(task.priority))}>
                            {task.priority}
                          </span>
                          {isOverdue(task.dueDate, task.status) && (
                            <span className="badge badge-error">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-base-content/60">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{format(parseISO(task.dueDate), 'HH:mm')}</span>
                          </div>
                          {task.assignedTo && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{task.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {task.project && (
                        <div className="flex items-center gap-2 ml-4">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-sm text-base-content/60">
                            {task.project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-base-content mb-2">Error Loading Calendar</h2>
        <p className="text-base-content/60">
          There was an error loading your calendar. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Calendar - Task Management</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-base-content mb-2">Calendar</h1>
            <p className="text-base-content/60">
              View and manage your tasks by date
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm ${showFilters ? 'btn-active' : 'btn-ghost'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a>Export as iCal</a></li>
                <li><a>Export as CSV</a></li>
                <li><a>Print Calendar</a></li>
              </ul>
            </div>
            
            <button
              onClick={() => handleDateClick(new Date())}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate(-1)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {view === 'month' && format(currentDate, 'MMMM yyyy')}
                {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
                {view === 'day' && format(currentDate, 'EEEE, MMM d, yyyy')}
              </h2>
              
              <button
                onClick={() => navigateDate(1)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn btn-ghost btn-sm"
            >
              Today
            </button>
          </div>

          {/* View Selector */}
          <div className="join">
            <button
              className={`join-item btn btn-sm ${view === 'month' ? 'btn-active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button
              className={`join-item btn btn-sm ${view === 'week' ? 'btn-active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button
              className={`join-item btn btn-sm ${view === 'day' ? 'btn-active' : ''}`}
              onClick={() => setView('day')}
            >
              Day
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Status</span>
                  </label>
                  <div className="space-y-2">
                    {['todo', 'in-progress', 'review', 'completed'].map(status => (
                      <label key={status} className="cursor-pointer label">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={filters.status.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                status: [...prev.status, status]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                status: prev.status.filter(s => s !== status)
                              }));
                            }
                          }}
                        />
                        <span className="label-text capitalize">
                          {status.replace('-', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Priority</span>
                  </label>
                  <div className="space-y-2">
                    {['low', 'medium', 'high', 'urgent'].map(priority => (
                      <label key={priority} className="cursor-pointer label">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={filters.priority.includes(priority)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                priority: [...prev.priority, priority]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                priority: prev.priority.filter(p => p !== priority)
                              }));
                            }
                          }}
                        />
                        <span className="label-text capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Projects Filter */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Projects</span>
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {projects.slice(0, 5).map(project => (
                      <label key={project._id} className="cursor-pointer label">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={filters.projects.includes(project._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                projects: [...prev.projects, project._id]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                projects: prev.projects.filter(p => p !== project._id)
                              }));
                            }
                          }}
                        />
                        <span className="label-text">{project.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ status: [], priority: [], assignedTo: [], projects: [] })}
                    className="btn btn-ghost btn-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : (
          <div>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </div>
        )}

        {/* Calendar Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded"></div>
            <span>Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-base-300 rounded"></div>
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-error rounded ring-1 ring-error"></div>
            <span>Overdue</span>
          </div>
        </div>

        {/* Create Task Modal */}
        {showCreateTask && (
          <CreateTaskModal
            isOpen={showCreateTask}
            onClose={() => {
              setShowCreateTask(false);
              setSelectedDate(null);
            }}
            initialDueDate={selectedDate}
            projectId={projectId}
          />
        )}

        {/* Task Quick View */}
        {selectedTask && (
          <TaskQuickView
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    </>
  );
};

export default TaskCalendar;