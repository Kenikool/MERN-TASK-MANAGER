import React, { useState } from 'react'
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
  Users,
  Target,
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Folder
} from 'lucide-react'
import { projectsAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const Projects = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch projects
  const { data: projectsData, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', { status: statusFilter, search: searchTerm }],
    queryFn: () => projectsAPI.getProjects({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
    }),
    select: (data) => data.data
  })

  const projects = projectsData?.projects || []

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success'
      case 'active': return 'text-primary'
      case 'on-hold': return 'text-warning'
      case 'cancelled': return 'text-error'
      default: return 'text-base-content'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'badge-success'
      case 'active': return 'badge-primary'
      case 'on-hold': return 'badge-warning'
      case 'cancelled': return 'badge-error'
      default: return 'badge-ghost'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'No deadline'
    return new Date(date).toLocaleDateString()
  }

  const calculateProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const handleCreateProject = () => {
    navigate('/projects/new')
  }

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation()
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectsAPI.deleteProject(projectId)
        toast.success('Project deleted successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to delete project')
      }
    }
  }

  // Project Card Component
  const ProjectCard = ({ project }) => {
    const progress = calculateProgress(project)
    
    return (
      <div 
        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-base-300"
        onClick={() => handleProjectClick(project._id)}
      >
        <div className="card-body p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="card-title text-lg font-semibold line-clamp-1">
                  {project.name}
                </h3>
                <span className={`badge ${getStatusBadge(project.status)} badge-sm`}>
                  {project.status}
                </span>
              </div>
            </div>
            
            <div className="dropdown dropdown-end">
              <button 
                className="btn btn-ghost btn-sm btn-circle"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <button onClick={() => navigate(`/projects/${project._id}`)}>
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate(`/projects/${project._id}/edit`)}>
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </li>
                <li>
                  <button 
                    onClick={(e) => handleDeleteProject(project._id, e)}
                    className="text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-base-content/70 line-clamp-2 mb-4">
              {project.description}
            </p>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-base-content/60">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{project.tasks?.length || 0}</div>
              <div className="text-xs text-base-content/60">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{project.members?.length || 0}</div>
              <div className="text-xs text-base-content/60">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {project.tasks?.filter(task => task.status === 'completed').length || 0}
              </div>
              <div className="text-xs text-base-content/60">Done</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Due: {formatDate(project.endDate)}</span>
            </div>
            
            {project.members && project.members.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="avatar-group -space-x-2">
                  {project.members.slice(0, 3).map((member, index) => (
                    <div key={index} className="avatar placeholder">
                      <div className="w-6 rounded-full bg-neutral text-neutral-content text-xs">
                        <span>{member.name?.charAt(0) || 'U'}</span>
                      </div>
                    </div>
                  ))}
                  {project.members.length > 3 && (
                    <div className="avatar placeholder">
                      <div className="w-6 rounded-full bg-base-300 text-base-content text-xs">
                        <span>+{project.members.length - 3}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

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
        <h3 className="text-lg font-semibold mb-2">Failed to load projects</h3>
        <p className="text-base-content/60 mb-4">There was an error loading your projects.</p>
        <button onClick={refetch} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Projects - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-base-content/60">
              Organize and manage your projects effectively
            </p>
          </div>
          
          <button 
            onClick={handleCreateProject}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Total Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <Folder className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Active</p>
                  <p className="text-2xl font-bold text-primary">
                    {projects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-success">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">On Hold</p>
                  <p className="text-2xl font-bold text-warning">
                    {projects.filter(p => p.status === 'on-hold').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>
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
                    placeholder="Search projects..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-base-300">
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
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Members</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => (
                    <tr 
                      key={project._id} 
                      className="hover cursor-pointer"
                      onClick={() => handleProjectClick(project._id)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Folder className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-base-content/60 line-clamp-1">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-base-300 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${calculateProgress(project)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{calculateProgress(project)}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{project.members?.length || 0}</span>
                        </div>
                      </td>
                      <td>
                        <span className={project.endDate && new Date(project.endDate) < new Date() ? 'text-error' : ''}>
                          {formatDate(project.endDate)}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/projects/${project._id}/edit`)
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs text-error"
                            onClick={(e) => handleDeleteProject(project._id, e)}
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
        {projects.length === 0 && (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-base-content/60 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button 
                onClick={handleCreateProject}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Projects