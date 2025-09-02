import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Tag,
  Palette,
  Settings,
  Plus,
  X,
  User
} from 'lucide-react'
import { projectsAPI, usersAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const schema = yup.object({
  name: yup
    .string()
    .required('Project name is required')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'])
    .required('Priority is required'),
  status: yup
    .string()
    .oneOf(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .required('Status is required'),
  startDate: yup.date().nullable(),
  endDate: yup.date().nullable(),
  budget: yup.number().min(0, 'Budget must be positive').nullable(),
  color: yup.string().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'),
  tags: yup.array().of(yup.string()),
  members: yup.array().of(
    yup.object({
      user: yup.string().required('User is required'),
      role: yup.string().oneOf(['admin', 'member']).required('Role is required')
    })
  )
})

const CreateProject = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      status: 'planning',
      startDate: null,
      endDate: null,
      budget: null,
      color: '#3B82F6',
      tags: [],
      members: [],
      settings: {
        isPublic: false,
        allowMemberInvite: true,
        requireApproval: false
      }
    }
  })

  const { fields: memberFields, append: appendMember, remove: removeMember } = useFieldArray({
    control,
    name: 'members'
  })

  // Fetch users for member selection
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getUsers(),
    select: (data) => data.data.users || []
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: projectsAPI.createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries(['dashboard'])
      toast.success('Project created successfully!')
      navigate('/projects')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project')
    }
  })

  const addMember = () => {
    appendMember({ user: '', role: 'member' })
  }

  const onSubmit = async (data) => {
    try {
      // Validate dates
      if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        toast.error('Start date cannot be after end date')
        return
      }

      const projectData = {
        ...data,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        budget: data.budget || undefined,
        tags: data.tags.filter(tag => tag.trim() !== ''),
        members: data.members.filter(member => member.user !== '')
      }

      await createProjectMutation.mutateAsync(projectData)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const users = usersData || []
  const watchedColor = watch('color')

  const colorPresets = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ]

  return (
    <>
      <Helmet>
        <title>Create Project - Task Management</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Create New Project</h1>
            <p className="text-base-content/60">Set up a new project to organize your tasks</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Project Information</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Name */}
                <div className="lg:col-span-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Project Name *</span>
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="Enter project name"
                      className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.name.message}</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Description</span>
                    </label>
                    <textarea
                      {...register('description')}
                      placeholder="Describe the project goals and objectives"
                      className={`textarea textarea-bordered h-24 ${errors.description ? 'textarea-error' : ''}`}
                    />
                    {errors.description && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.description.message}</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Priority *</span>
                  </label>
                  <select {...register('priority')} className="select select-bordered">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Status */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Status *</span>
                  </label>
                  <select {...register('status')} className="select select-bordered">
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates and Budget */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Calendar className="w-5 h-5" />
                Timeline & Budget
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Start Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Start Date</span>
                  </label>
                  <input
                    {...register('startDate')}
                    type="date"
                    className="input input-bordered"
                  />
                </div>

                {/* End Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">End Date</span>
                  </label>
                  <input
                    {...register('endDate')}
                    type="date"
                    className="input input-bordered"
                  />
                </div>

                {/* Budget */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Budget</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                    <input
                      {...register('budget')}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="input input-bordered pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Palette className="w-5 h-5" />
                Appearance
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Color */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Project Color</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      {...register('color')}
                      type="color"
                      className="w-12 h-12 rounded-lg border border-base-300 cursor-pointer"
                    />
                    <input
                      {...register('color')}
                      type="text"
                      placeholder="#3B82F6"
                      className="input input-bordered flex-1"
                    />
                  </div>
                  
                  {/* Color Presets */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {colorPresets.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          watchedColor === color ? 'border-base-content' : 'border-base-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Tags</span>
                  </label>
                  <input
                    type="text"
                    placeholder="frontend, mobile, urgent (comma separated)"
                    className="input input-bordered"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim())
                      setValue('tags', tags)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">
                  <Users className="w-5 h-5" />
                  Team Members
                </h2>
                <button
                  type="button"
                  onClick={addMember}
                  className="btn btn-outline btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </button>
              </div>
              
              <div className="space-y-3">
                {memberFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <select
                        {...register(`members.${index}.user`)}
                        className="select select-bordered w-full"
                      >
                        <option value="">Select user</option>
                        {users.filter(u => u._id !== user.id).map(user => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <select
                        {...register(`members.${index}.role`)}
                        className="select select-bordered w-full"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {memberFields.length === 0 && (
                  <p className="text-base-content/60 text-center py-4">
                    No team members added. Click "Add Member" to invite users to this project.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Project Settings */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Settings className="w-5 h-5" />
                Project Settings
              </h2>
              
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Make project public</span>
                    <input
                      {...register('settings.isPublic')}
                      type="checkbox"
                      className="toggle toggle-primary"
                    />
                  </label>
                  <div className="label">
                    <span className="label-text-alt text-base-content/60">
                      Public projects can be viewed by all users
                    </span>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Allow members to invite others</span>
                    <input
                      {...register('settings.allowMemberInvite')}
                      type="checkbox"
                      className="toggle toggle-primary"
                      defaultChecked
                    />
                  </label>
                  <div className="label">
                    <span className="label-text-alt text-base-content/60">
                      Project members can invite new users to join
                    </span>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Require approval for new members</span>
                    <input
                      {...register('settings.requireApproval')}
                      type="checkbox"
                      className="toggle toggle-primary"
                    />
                  </label>
                  <div className="label">
                    <span className="label-text-alt text-base-content/60">
                      New member invitations require admin approval
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
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
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CreateProject