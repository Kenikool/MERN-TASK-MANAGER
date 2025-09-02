import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  Edit, 
  Trash2, 
  Play, 
  Square,
  DollarSign,
  Calendar,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { timeTrackingAPI } from '../../utils/api';
import { formatDate, cn } from '../../utils/cn';

const TimeEntryItem = ({ entry, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (isRunning) => {
    return isRunning ? 'text-success' : 'text-base-content';
  };

  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Task and Project Info */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.project?.color || '#3B82F6' }}
              />
              <span className="font-medium text-base-content">
                {entry.task?.title}
              </span>
              <span className="text-sm text-base-content/60">
                in {entry.project?.name}
              </span>
            </div>

            {/* Description */}
            {entry.description && (
              <p className="text-sm text-base-content/70 mb-2">
                {entry.description}
              </p>
            )}

            {/* Time and Date Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(entry.startTime)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date(entry.startTime).toLocaleTimeString()} - {' '}
                  {entry.endTime 
                    ? new Date(entry.endTime).toLocaleTimeString()
                    : 'Running'
                  }
                </span>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-1">
                  {entry.tags.map((tag, index) => (
                    <span key={index} className="badge badge-outline badge-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duration and Actions */}
          <div className="flex items-center gap-3">
            {/* Duration */}
            <div className="text-right">
              <div className={cn(
                "text-lg font-semibold",
                getStatusColor(entry.isRunning)
              )}>
                {entry.isRunning ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    Running
                  </div>
                ) : (
                  formatDuration(entry.duration)
                )}
              </div>
              
              {entry.billable && entry.hourlyRate > 0 && !entry.isRunning && (
                <div className="text-sm text-success flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(entry.earnings)}
                </div>
              )}
              
              {entry.billable && (
                <div className="badge badge-success badge-xs">Billable</div>
              )}
            </div>

            {/* Actions Menu */}
            <div className="dropdown dropdown-end">
              <button 
                tabIndex={0} 
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li>
                    <button onClick={() => onEdit(entry)}>
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </li>
                  {!entry.isRunning && (
                    <li>
                      <button 
                        onClick={() => onDelete(entry._id)}
                        className="text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeEntryList = ({ data, isLoading, filters }) => {
  const queryClient = useQueryClient();
  const [editingEntry, setEditingEntry] = useState(null);

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => timeTrackingAPI.deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries']);
      queryClient.invalidateQueries(['timeStats']);
      toast.success('Time entry deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete time entry');
    }
  });

  const handleEdit = (entry) => {
    setEditingEntry(entry);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                  <div className="skeleton h-3 w-2/3"></div>
                </div>
                <div className="skeleton h-8 w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entries = data?.data || [];
  const summary = data?.summary || {};

  if (entries.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body text-center py-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-base-content/40" />
          <h3 className="text-xl font-semibold text-base-content mb-2">
            No time entries found
          </h3>
          <p className="text-base-content/60 mb-4">
            Start tracking time on your tasks to see entries here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-4">
          <h3 className="font-semibold mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {summary.totalHours?.toFixed(1) || 0}h
              </div>
              <div className="text-sm text-base-content/60">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {summary.billableHours?.toFixed(1) || 0}h
              </div>
              <div className="text-sm text-base-content/60">Billable Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {summary.totalEntries || 0}
              </div>
              <div className="text-sm text-base-content/60">Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                ${summary.totalEarnings?.toFixed(2) || 0}
              </div>
              <div className="text-sm text-base-content/60">Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <TimeEntryItem
            key={entry._id}
            entry={entry}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="join">
            {[...Array(data.pagination.pages)].map((_, i) => (
              <button
                key={i}
                className={`join-item btn ${
                  data.pagination.page === i + 1 ? 'btn-active' : ''
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeEntryList;