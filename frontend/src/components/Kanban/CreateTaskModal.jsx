import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksAPI, usersAPI } from '../../utils/api';

const schema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: yup
    .string()
    .max(1000, 'Description cannot exceed 1000 characters'),
  assignedTo: yup
    .string(),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'])
    .required('Priority is required'),
  dueDate: yup
    .date()
    .nullable(),
});

const CreateTaskModal = ({ isOpen, onClose, projectId, initialStatus = 'todo' }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      status: initialStatus,
      dueDate: null
    }
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => usersAPI.getTeamMembers().then(res => res.data.data),
    enabled: isOpen
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => tasksAPI.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task created successfully!');
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  });

  const onSubmit = (data) => {
    const taskData = {
      ...data,
      project: projectId,
      status: initialStatus,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
    };

    createTaskMutation.mutate(taskData);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  if (!isOpen) return null;

  const getStatusTitle = (status) => {
    const titles = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'review': 'Review',
      'completed': 'Completed'
    };
    return titles[status] || 'New Task';
  };

  return (
    <div className=\"modal modal-open\">\n      <div className=\"modal-box w-11/12 max-w-lg\">\n        <form onSubmit={handleSubmit(onSubmit)}>\n          {/* Header */}\n          <div className=\"flex justify-between items-center mb-6\">\n            <h3 className=\"font-bold text-lg\">\n              Add Task to {getStatusTitle(initialStatus)}\n            </h3>\n            <button\n              type=\"button\"\n              onClick={handleClose}\n              className=\"btn btn-ghost btn-sm btn-circle\"\n            >\n              <X className=\"w-4 h-4\" />\n            </button>\n          </div>\n\n          <div className=\"space-y-4\">\n            {/* Title */}\n            <div className=\"form-control\">\n              <label className=\"label\">\n                <span className=\"label-text\">Title *</span>\n              </label>\n              <input\n                {...register('title')}\n                type=\"text\"\n                placeholder=\"Enter task title\"\n                className={`input input-bordered ${errors.title ? 'input-error' : ''}`}\n                autoFocus\n              />\n              {errors.title && (\n                <label className=\"label\">\n                  <span className=\"label-text-alt text-error\">{errors.title.message}</span>\n                </label>\n              )}\n            </div>\n\n            {/* Description */}\n            <div className=\"form-control\">\n              <label className=\"label\">\n                <span className=\"label-text\">Description</span>\n              </label>\n              <textarea\n                {...register('description')}\n                placeholder=\"Describe the task\"\n                className={`textarea textarea-bordered h-20 ${errors.description ? 'textarea-error' : ''}`}\n              />\n              {errors.description && (\n                <label className=\"label\">\n                  <span className=\"label-text-alt text-error\">{errors.description.message}</span>\n                </label>\n              )}\n            </div>\n\n            {/* Assigned To and Priority */}\n            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n              <div className=\"form-control\">\n                <label className=\"label\">\n                  <span className=\"label-text\">Assigned To</span>\n                </label>\n                <select\n                  {...register('assignedTo')}\n                  className=\"select select-bordered\"\n                >\n                  <option value=\"\">Unassigned</option>\n                  {teamMembers.map((member) => (\n                    <option key={member._id} value={member._id}>\n                      {member.name} ({member.role})\n                    </option>\n                  ))}\n                </select>\n              </div>\n\n              <div className=\"form-control\">\n                <label className=\"label\">\n                  <span className=\"label-text\">Priority *</span>\n                </label>\n                <select\n                  {...register('priority')}\n                  className={`select select-bordered ${errors.priority ? 'select-error' : ''}`}\n                >\n                  <option value=\"low\">Low</option>\n                  <option value=\"medium\">Medium</option>\n                  <option value=\"high\">High</option>\n                  <option value=\"urgent\">Urgent</option>\n                </select>\n              </div>\n            </div>\n\n            {/* Due Date */}\n            <div className=\"form-control\">\n              <label className=\"label\">\n                <span className=\"label-text\">Due Date</span>\n              </label>\n              <input\n                {...register('dueDate')}\n                type=\"datetime-local\"\n                className=\"input input-bordered\"\n              />\n            </div>\n          </div>\n\n          {/* Actions */}\n          <div className=\"modal-action\">\n            <button\n              type=\"button\"\n              onClick={handleClose}\n              className=\"btn btn-ghost\"\n            >\n              Cancel\n            </button>\n            <button\n              type=\"submit\"\n              disabled={createTaskMutation.isPending}\n              className=\"btn btn-primary\"\n            >\n              {createTaskMutation.isPending ? (\n                <>\n                  <span className=\"loading loading-spinner loading-sm\"></span>\n                  Creating...\n                </>\n              ) : (\n                <>\n                  <Plus className=\"w-4 h-4 mr-2\" />\n                  Create Task\n                </>\n              )}\n            </button>\n          </div>\n        </form>\n      </div>\n    </div>\n  );\n};\n\nexport default CreateTaskModal;