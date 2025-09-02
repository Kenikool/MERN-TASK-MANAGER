import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  ExternalLink,
  MessageCircle,
  Paperclip
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

import { tasksAPI } from '../../utils/api';
import { formatDate, isOverdue, getStatusColor, getPriorityColor, cn } from '../../utils/cn';
import Timer from '../TimeTracking/Timer';

const TaskQuickView = ({ task, isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksAPI.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-tasks']);
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task status updated');
    },
    onError: (error) => {
      toast.error('Failed to update task status');
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksAPI.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-tasks']);
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task deleted');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to delete task');
    }
  });

  const handleStatusChange = (newStatus) => {
    setIsUpdating(true);
    updateStatusMutation.mutate(
      { taskId: task._id, status: newStatus },
      {
        onSettled: () => setIsUpdating(false)
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(task._id);
    }
  };

  const handleEdit = () => {
    navigate(`/tasks/${task._id}/edit`);
    onClose();
  };

  const handleViewFull = () => {
    navigate(`/tasks/${task._id}`);
    onClose();
  };

  if (!isOpen || !task) return null;

  const taskIsOverdue = isOverdue(task.dueDate, task.status);
  const completionPercentage = task.completionPercentage || 0;

  const getStatusIcon = (status) => {
    const icons = {
      'todo': '📋',
      'in-progress': '🔄',
      'review': '👀',
      'completed': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '📋';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };
    return icons[priority] || '🟡';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getStatusIcon(task.status)}</span>
              <h3 className="font-bold text-xl text-base-content line-clamp-2">
                {task.title}
              </h3>
            </div>
            
            {/* Status and Priority Badges */}
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("badge", getStatusColor(task.status))}>
                {task.status.replace('-', ' ')}
              </span>
              <span className={cn("badge badge-outline", getPriorityColor(task.priority))}>
                {getPriorityIcon(task.priority)} {task.priority}
              </span>
              {taskIsOverdue && (
                <span className="badge badge-error">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overdue
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Image */}
        {task.image && (
          <figure className="mb-4">
            <img
              src={task.image.url}
              alt={task.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          </figure>
        )}

        {/* Description */}
        {task.description && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-base-content/80 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Progress */}
        {completionPercentage > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Progress</span>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={completionPercentage}
              max="100"
            />
          </div>
        )}

        {/* Task Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-base-content/60" />
              <div>
                <div className="text-sm text-base-content/60">Due Date</div>
                <div className={cn(
                  "font-medium",
                  taskIsOverdue ? "text-error" : "text-base-content"
                )}>
                  {format(parseISO(task.dueDate), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            </div>
          )}

          {/* Assigned To */}
          {task.assignedTo && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-base-content/60" />
              <div>
                <div className="text-sm text-base-content/60">Assigned To</div>
                <div className="font-medium">{task.assignedTo.name}</div>
              </div>
            </div>
          )}

          {/* Project */}
          {task.project && (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              <div>
                <div className="text-sm text-base-content/60">Project</div>
                <div className="font-medium">{task.project.name}</div>
              </div>
            </div>
          )}

          {/* Created */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-base-content/60" />
            <div>
              <div className="text-sm text-base-content/60">Created</div>
              <div className="font-medium">{formatDate(task.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <span key={index} className="badge badge-outline badge-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collaborators */}
        {task.collaborators && task.collaborators.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Collaborators</h4>
            <div className="flex flex-wrap gap-2">
              {task.collaborators.map((collaborator) => (
                <div key={collaborator._id} className="flex items-center gap-2 bg-base-200 px-2 py-1 rounded">
                  <div className="avatar">
                    <div className="w-6 rounded-full">
                      {collaborator.avatar ? (
                        <img src={collaborator.avatar} alt={collaborator.name} />
                      ) : (
                        <div className="bg-neutral text-neutral-content w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {collaborator.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm">{collaborator.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Tracking */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Time Tracking</h4>
          <Timer taskId={task._id} taskTitle={task.title} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {task.comments?.length || 0}
            </div>
            <div className="text-xs text-base-content/60">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-info">
              {task.attachments?.length || 0}
            </div>
            <div className="text-xs text-base-content/60">Attachments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-success">
              {task.actualHours?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-xs text-base-content/60">Time Logged</div>
          </div>
        </div>

        {/* Status Update Buttons */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            {task.status !== 'todo' && (
              <button
                onClick={() => handleStatusChange('todo')}
                disabled={isUpdating}
                className="btn btn-outline btn-sm"
              >
                📋 To Do
              </button>
            )}
            {task.status !== 'in-progress' && (
              <button
                onClick={() => handleStatusChange('in-progress')}
                disabled={isUpdating}
                className="btn btn-outline btn-sm"
              >
                🔄 In Progress
              </button>
            )}
            {task.status !== 'review' && (
              <button
                onClick={() => handleStatusChange('review')}
                disabled={isUpdating}
                className="btn btn-outline btn-sm"
              >
                👀 Review
              </button>
            )}
            {task.status !== 'completed' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
                className="btn btn-success btn-sm"
              >
                ✅ Complete
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action">
          <button
            onClick={handleViewFull}
            className="btn btn-primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Details
          </button>
          
          <button
            onClick={handleEdit}
            className="btn btn-outline"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost">
              More
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <button onClick={() => navigator.clipboard.writeText(window.location.origin + `/tasks/${task._id}`)}>
                  Copy Link
                </button>
              </li>
              <li>
                <button>Duplicate Task</button>
              </li>
              <li className="divider"></li>
              <li>
                <button onClick={handleDelete} className="text-error">
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              </li>
            </ul>
          </div>
          
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskQuickView;