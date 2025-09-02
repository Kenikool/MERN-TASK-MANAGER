import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { timeTrackingAPI, tasksAPI, projectsAPI } from '../../utils/api';

const schema = yup.object({
  taskId: yup
    .string()
    .required('Task is required'),
  startTime: yup
    .string()
    .required('Start time is required'),
  endTime: yup
    .string()
    .required('End time is required')
    .test('is-after-start', 'End time must be after start time', function(value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;
      return new Date(value) > new Date(startTime);
    }),
  description: yup
    .string()
    .max(500, 'Description cannot exceed 500 characters'),
  billable: yup
    .boolean(),
  hourlyRate: yup
    .number()
    .min(0, 'Hourly rate must be positive')
    .nullable()
});

const ManualEntryModal = ({ isOpen, onClose, editEntry = null }) => {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      taskId: editEntry?.task?._id || '',
      startTime: editEntry?.startTime 
        ? new Date(editEntry.startTime).toISOString().slice(0, 16)
        : '',
      endTime: editEntry?.endTime 
        ? new Date(editEntry.endTime).toISOString().slice(0, 16)
        : '',
      description: editEntry?.description || '',
      billable: editEntry?.billable ?? true,
      hourlyRate: editEntry?.hourlyRate || 0
    }
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getProjects({ limit: 100 }).then(res => res.data.data),
    enabled: isOpen
  });

  // Fetch tasks for selected project
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { project: selectedProject }],
    queryFn: () => tasksAPI.getTasks({ 
      project: selectedProject, 
      limit: 100 
    }).then(res => res.data.data),
    enabled: !!selectedProject
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editEntry) {
        return timeTrackingAPI.updateTimeEntry(editEntry._id, data);
      } else {
        return timeTrackingAPI.createManualEntry(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries']);
      queryClient.invalidateQueries(['timeStats']);
      queryClient.invalidateQueries(['tasks']);
      toast.success(editEntry ? 'Time entry updated!' : 'Manual entry created!');
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save time entry');
    }
  });

  const onSubmit = (data) => {
    const submitData = {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      hourlyRate: data.billable ? (data.hourlyRate || 0) : 0
    };

    saveMutation.mutate(submitData);
  };

  const handleClose = () => {
    onClose();
    reset();
    setSelectedProject('');
  };

  const calculateDuration = () => {
    const startTime = watch('startTime');
    const endTime = watch('endTime');
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      }
    }
    
    return '0h 0m';
  };

  const calculateEarnings = () => {
    const startTime = watch('startTime');
    const endTime = watch('endTime');
    const billable = watch('billable');
    const hourlyRate = watch('hourlyRate');
    
    if (startTime && endTime && billable && hourlyRate) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffHours = (end - start) / (1000 * 60 * 60);
      
      if (diffHours > 0) {
        return (diffHours * hourlyRate).toFixed(2);
      }
    }
    
    return '0.00';
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">
              {editEntry ? 'Edit Time Entry' : 'Add Manual Time Entry'}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Project Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Project *</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setValue('taskId', ''); // Reset task selection
                }}
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Task *</span>
              </label>
              <select
                {...register('taskId')}
                className={`select select-bordered ${errors.taskId ? 'select-error' : ''}`}
                disabled={!selectedProject}
              >
                <option value="">Select a task</option>
                {tasks.map((task) => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {errors.taskId && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.taskId.message}</span>
                </label>
              )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Start Time *</span>
                </label>
                <input
                  {...register('startTime')}
                  type="datetime-local"
                  className={`input input-bordered ${errors.startTime ? 'input-error' : ''}`}
                />
                {errors.startTime && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.startTime.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">End Time *</span>
                </label>
                <input
                  {...register('endTime')}
                  type="datetime-local"
                  className={`input input-bordered ${errors.endTime ? 'input-error' : ''}`}
                />
                {errors.endTime && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.endTime.message}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Duration Display */}
            <div className="alert alert-info">
              <Clock className="w-5 h-5" />
              <span>Duration: <strong>{calculateDuration()}</strong></span>
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                {...register('description')}
                className={`textarea textarea-bordered ${errors.description ? 'textarea-error' : ''}`}
                placeholder="What did you work on?"
                rows="3"
              />
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.description.message}</span>
                </label>
              )}
            </div>

            {/* Billable Settings */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="form-control">
                  <label className="cursor-pointer label">
                    <span className="label-text">Billable</span>
                    <input
                      {...register('billable')}
                      type="checkbox"
                      className="checkbox checkbox-primary"
                    />
                  </label>
                </div>

                {watch('billable') && (
                  <div className="form-control mt-2">
                    <label className="label">
                      <span className="label-text">Hourly Rate ($)</span>
                    </label>
                    <input
                      {...register('hourlyRate')}
                      type="number"
                      step="0.01"
                      min="0"
                      className={`input input-bordered ${errors.hourlyRate ? 'input-error' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.hourlyRate && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.hourlyRate.message}</span>
                      </label>
                    )}
                    
                    {watch('hourlyRate') > 0 && (
                      <div className="alert alert-success mt-2">
                        <DollarSign className="w-5 h-5" />
                        <span>Estimated earnings: <strong>${calculateEarnings()}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="btn btn-primary"
            >
              {saveMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                editEntry ? 'Update Entry' : 'Create Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;