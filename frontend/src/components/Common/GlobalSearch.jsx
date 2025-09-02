import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  X,
  Clock,
  CheckSquare,
  Folder,
  User,
  Calendar,
  ArrowRight,
  Zap,
  Filter
} from 'lucide-react'
import { tasksAPI, projectsAPI, usersAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recentSearches, setRecentSearches] = useState([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const inputRef = useRef(null)

  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', query, selectedCategory],
    queryFn: async () => {
      if (!query.trim()) return { tasks: [], projects: [], users: [] }
      
      const promises = []
      
      if (selectedCategory === 'all' || selectedCategory === 'tasks') {
        promises.push(tasksAPI.getTasks({ search: query, limit: 5 }))
      }
      if (selectedCategory === 'all' || selectedCategory === 'projects') {
        promises.push(projectsAPI.getProjects({ search: query, limit: 5 }))
      }
      if (selectedCategory === 'all' || selectedCategory === 'users') {
        promises.push(usersAPI.getUsers({ search: query, limit: 5 }))
      }
      
      const results = await Promise.all(promises)
      
      return {
        tasks: selectedCategory === 'all' || selectedCategory === 'tasks' ? results[0]?.data?.tasks || [] : [],
        projects: selectedCategory === 'all' || selectedCategory === 'projects' ? 
          (selectedCategory === 'tasks' ? results[1]?.data?.projects || [] : results[0]?.data?.projects || []) : [],
        users: selectedCategory === 'all' || selectedCategory === 'users' ? 
          (selectedCategory === 'tasks' ? 
            (selectedCategory === 'projects' ? results[2]?.data?.users || [] : results[1]?.data?.users || []) :
            results[0]?.data?.users || []) : []
      }
    },
    enabled: query.length > 0,
    staleTime: 30000
  })

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault()
        if (!isOpen) {
          // Open search from anywhere
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const newRecentSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))
    }
  }

  const handleResultClick = (type, id) => {
    handleSearch(query)
    onClose()
    
    switch (type) {
      case 'task':
        navigate(`/tasks/${id}`)
        break
      case 'project':
        navigate(`/projects/${id}`)
        break
      case 'user':
        navigate(`/team`)
        break
      default:
        break
    }
  }

  const categories = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'users', label: 'People', icon: User }
  ]

  const getResultIcon = (type) => {
    switch (type) {
      case 'task': return CheckSquare
      case 'project': return Folder
      case 'user': return User
      default: return Search
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success'
      case 'in-progress': return 'text-warning'
      case 'active': return 'text-primary'
      case 'on-hold': return 'text-warning'
      default: return 'text-base-content'
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-base-100 rounded-lg shadow-2xl border border-base-300 animate-slide-in">
        {/* Search Header */}
        <div className="flex items-center gap-4 p-4 border-b border-base-300">
          <Search className="w-5 h-5 text-base-content/60" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, projects, people..."
            className="flex-1 bg-transparent outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleSearch(query)
              }
            }}
          />
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 p-4 border-b border-base-300">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`btn btn-sm ${
                  selectedCategory === category.id ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.label}
              </button>
            )
          })}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && query && (
            <div className="flex items-center justify-center p-8">
              <div className="loading loading-spinner loading-md text-primary"></div>
            </div>
          )}

          {!query && (
            <div className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </h3>
              {recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="flex items-center gap-3 w-full p-2 hover:bg-base-200 rounded-lg text-left"
                    >
                      <Clock className="w-4 h-4 text-base-content/40" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/60 text-sm">No recent searches</p>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose()
                      navigate('/tasks/new')
                    }}
                    className="btn btn-outline btn-sm justify-start"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    New Task
                  </button>
                  <button
                    onClick={() => {
                      onClose()
                      navigate('/projects/new')
                    }}
                    className="btn btn-outline btn-sm justify-start"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    New Project
                  </button>
                  <button
                    onClick={() => {
                      onClose()
                      navigate('/calendar')
                    }}
                    className="btn btn-outline btn-sm justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar
                  </button>
                  <button
                    onClick={() => {
                      onClose()
                      navigate('/reports')
                    }}
                    className="btn btn-outline btn-sm justify-start"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Reports
                  </button>
                </div>
              </div>
            </div>
          )}

          {query && searchResults && (
            <div className="p-4 space-y-4">
              {/* Tasks */}
              {searchResults.tasks && searchResults.tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Tasks ({searchResults.tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.tasks.map(task => (
                      <button
                        key={task._id}
                        onClick={() => handleResultClick('task', task._id)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-base-200 rounded-lg text-left"
                      >
                        <CheckSquare className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="flex items-center gap-2 text-sm text-base-content/60">
                            <span className={`capitalize ${getStatusColor(task.status)}`}>
                              {task.status.replace('-', ' ')}
                            </span>
                            {task.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due {formatDate(task.dueDate)}</span>
                              </>
                            )}
                            {task.project && (
                              <>
                                <span>•</span>
                                <span>{task.project.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-base-content/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {searchResults.projects && searchResults.projects.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Projects ({searchResults.projects.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.projects.map(project => (
                      <button
                        key={project._id}
                        onClick={() => handleResultClick('project', project._id)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-base-200 rounded-lg text-left"
                      >
                        <Folder className="w-4 h-4 text-info" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{project.name}</div>
                          <div className="flex items-center gap-2 text-sm text-base-content/60">
                            <span className={`capitalize ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            <span>•</span>
                            <span>{project.tasks?.length || 0} tasks</span>
                            <span>•</span>
                            <span>{project.members?.length || 0} members</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-base-content/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {searchResults.users && searchResults.users.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    People ({searchResults.users.length})
                  </h3>
                  <div className="space-y-2">
                    {searchResults.users.map(person => (
                      <button
                        key={person._id}
                        onClick={() => handleResultClick('user', person._id)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-base-200 rounded-lg text-left"
                      >
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span className="text-xs">
                              {person.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{person.name}</div>
                          <div className="flex items-center gap-2 text-sm text-base-content/60">
                            <span className="capitalize">{person.role}</span>
                            {person.department && (
                              <>
                                <span>•</span>
                                <span>{person.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-base-content/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {query && searchResults && 
               !searchResults.tasks?.length && 
               !searchResults.projects?.length && 
               !searchResults.users?.length && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No results found</h3>
                  <p className="text-base-content/60 text-sm">
                    Try adjusting your search terms or browse by category
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-base-300 text-xs text-base-content/60">
          <div className="flex items-center gap-4">
            <span>Press <kbd className="kbd kbd-xs">↵</kbd> to search</span>
            <span>Press <kbd className="kbd kbd-xs">Esc</kbd> to close</span>
          </div>
          <span>Ctrl + / to open from anywhere</span>
        </div>
      </div>
    </div>
  )
}

export default GlobalSearch