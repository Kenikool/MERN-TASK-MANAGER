import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Grid3X3,
  List
} from 'lucide-react'
import { usersAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const Team = () => {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch team members
  const { data: teamData, isLoading, error, refetch } = useQuery({
    queryKey: ['team', { role: roleFilter, department: departmentFilter, search: searchTerm }],
    queryFn: () => usersAPI.getUsers({
      role: roleFilter !== 'all' ? roleFilter : undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
      search: searchTerm || undefined,
    }),
    select: (data) => data.data
  })

  const teamMembers = teamData?.users || []

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'badge-error'
      case 'manager': return 'badge-warning'
      case 'member': return 'badge-info'
      default: return 'badge-ghost'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Not available'
    return new Date(date).toLocaleDateString()
  }

  const handleInviteUser = () => {
    toast.info('Invite user feature coming soon!')
  }

  const handleEditUser = (userId) => {
    toast.info('Edit user feature coming soon!')
  }

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      toast.info('Delete user feature coming soon!')
    }
  }

  // Team Member Card Component
  const TeamMemberCard = ({ member }) => (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-300">
      <div className="card-body p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 rounded-full">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} />
                ) : (
                  <div className="bg-primary text-primary-content w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <span className={`badge ${getRoleColor(member.role)} badge-sm`}>
                {member.role}
              </span>
            </div>
          </div>
          
          <div className="dropdown dropdown-end">
            <button className="btn btn-ghost btn-sm btn-circle">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <button onClick={() => handleEditUser(member._id)}>
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </li>
              {user.role === 'admin' && member._id !== user.id && (
                <li>
                  <button 
                    onClick={() => handleDeleteUser(member._id)}
                    className="text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          {member.position && (
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-base-content/60" />
              <span>{member.position}</span>
            </div>
          )}
          
          {member.department && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-base-content/60" />
              <span>{member.department}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-base-content/60" />
            <span className="truncate">{member.email}</span>
          </div>
          
          {member.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-base-content/60" />
              <span>{member.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-base-content/60" />
            <span>Joined {formatDate(member.createdAt)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-base-300">
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <span>Last active: {formatDate(member.lastLogin)}</span>
            <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-success' : 'bg-base-300'}`}></div>
          </div>
        </div>
      </div>
    </div>
  )

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
        <Users className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load team</h3>
        <p className="text-base-content/60 mb-4">There was an error loading team members.</p>
        <button onClick={refetch} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Team - Task Management</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Team</h1>
            <p className="text-base-content/60">
              Manage your team members and their roles
            </p>
          </div>
          
          {user.role === 'admin' && (
            <button 
              onClick={handleInviteUser}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Total Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Admins</p>
                  <p className="text-2xl font-bold text-error">
                    {teamMembers.filter(m => m.role === 'admin').length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-error" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Managers</p>
                  <p className="text-2xl font-bold text-warning">
                    {teamMembers.filter(m => m.role === 'manager').length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Active</p>
                  <p className="text-2xl font-bold text-success">
                    {teamMembers.filter(m => m.isActive).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-success" />
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
                    placeholder="Search team members..."
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
                    <span className="label-text">Role</span>
                  </label>
                  <select 
                    className="select select-bordered select-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Department</span>
                  </label>
                  <select 
                    className="select select-bordered select-sm"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Members Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map(member => (
              <TeamMemberCard key={member._id} member={member} />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map(member => (
                    <tr key={member._id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 rounded-full">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} />
                              ) : (
                                <div className="bg-primary text-primary-content w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                                  {member.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{member.name}</div>
                            {member.position && (
                              <div className="text-sm text-base-content/60">{member.position}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>{member.department || 'Not specified'}</td>
                      <td>{member.email}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-success' : 'bg-base-300'}`}></div>
                          <span className="text-sm">{member.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleEditUser(member._id)}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {user.role === 'admin' && member._id !== user.id && (
                            <button 
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDeleteUser(member._id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
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
        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members found</h3>
            <p className="text-base-content/60 mb-6">
              {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by inviting team members to your workspace'
              }
            </p>
            {(!searchTerm && roleFilter === 'all' && departmentFilter === 'all') && user.role === 'admin' && (
              <button 
                onClick={handleInviteUser}
                className="btn btn-primary"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Team