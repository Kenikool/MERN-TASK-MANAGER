import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  Image,
  Plus,
  X,
  Upload,
  AlertCircle
} from 'lucide-react'
import { tasksAPI, projectsAPI, usersAPI, uploadAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const schema = yup.object({
  title: yup
    .string()
    .required('Task title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: yup
    .string()
    .max(2000, 'Description cannot exceed 2000 characters'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'])
    .required('Priority is required'),
  status: yup
    .string()
    .oneOf(['todo', 'in-progress', 'review', 'completed'])
    .required('Status is required'),
  dueDate: yup.date().nullable(),
  startDate: yup.date().nullable(),
  estimatedHours: yup.number().min(0, 'Estimated hours must be positive').nullable(),
  assignedTo: yup.string().nullable(),
  project: yup.string().nullable(),
  tags: yup.array().of(yup.string()),
  checklist: yup.array().of(
    yup.object({
      text: yup.string().required('Checklist item text is required')
    })
  )
})

const CreateTask = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [uploadingImage, setUploadingImage] = useState(false)
  const [taskImage, setTaskImage] = useState(null)

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
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: null,
      startDate: null,
      estimatedHours: null,
      assignedTo: '',
      project: '',
      tags: [],
      checklist: []
    }
  })

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control,
    name: 'checklist'
  })

  // Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getProjects(),
    select: (data) => data.data.projects || []
  })

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getUsers(),
    select: (data) => data.data.users || []
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: tasksAPI.createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tasks'])
      queryClient.invalidateQueries(['dashboard'])
      toast.success('Task created successfully!')
      navigate('/tasks')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task')
    }
  })

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setUploadingImage(true)
    try {
      const response = await uploadAPI.uploadImage(file)
      setTaskImage(response.data.image)
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setTaskImage(null)
  }

  const addChecklistItem = () => {
    appendChecklist({ text: '' })
  }

  const onSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        image: taskImage,
        dueDate: data.dueDate || undefined,
        startDate: data.startDate || undefined,
        estimatedHours: data.estimatedHours || undefined,
        assignedTo: data.assignedTo || undefined,
        project: data.project || undefined,
        tags: data.tags.filter(tag => tag.trim() !== ''),
        checklist: data.checklist.filter(item => item.text.trim() !== '')
      }

      await createTaskMutation.mutateAsync(taskData)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const projects = projectsData || []
  const users = usersData || []

  return (
    <>
      <Helmet>
        <title>Create Task - Task Management</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Create New Task</h1>
            <p className="text-base-content/60">Add a new task to your workflow</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Information */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Task Information</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Task Title *</span>
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      placeholder="Enter task title"
                      className={`input input-bordered ${errors.title ? 'input-error' : ''}`}
                    />
                    {errors.title && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.title.message}</span>
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
                      placeholder="Describe the task in detail"
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
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Project */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Project</span>
                  </label>
                  <select {...register('project')} className="select select-bordered">
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Assign To</span>
                  </label>
                  <select {...register('assignedTo')} className="select select-bordered">
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates and Time */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Calendar className="w-5 h-5" />
                Dates & Time
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

                {/* Due Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Due Date</span>
                  </label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    className="input input-bordered"
                  />
                </div>

                {/* Estimated Hours */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Estimated Hours</span>
                  </label>
                  <input
                    {...register('estimatedHours')}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="input input-bordered"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Image className="w-5 h-5" />
                Task Image
              </h2>
              
              {taskImage ? (
                <div className="relative">
                  <img
                    src={taskImage.url}
                    alt="Task"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="btn btn-error btn-sm btn-circle absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
                  <p className="text-base-content/60 mb-4">
                    Upload an image for this task (optional)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input file-input-bordered file-input-primary"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <div className="mt-4">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span className="ml-2 text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Tag className="w-5 h-5" />
                Tags
              </h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Add tags (comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="frontend, urgent, bug-fix"
                  className="input input-bordered"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim())
                    setValue('tags', tags)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">
                  <FileText className="w-5 h-5" />
                  Checklist
                </h2>
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="btn btn-outline btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {checklistFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3">
                    <input
                      {...register(`checklist.${index}.text`)}
                      type="text"
                      placeholder="Checklist item"
                      className="input input-bordered flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeChecklist(index)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {checklistFields.length === 0 && (
                  <p className="text-base-content/60 text-center py-4">
                    No checklist items. Click "Add Item" to create one.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
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
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CreateTask