import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Settings,
  Trash2,
  Filter,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { notificationsAPI } from '../../utils/api';
import { formatDate, cn } from '../../utils/cn';

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onNavigate }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: '🎯',
      task_completed: '✅',
      task_overdue: '⚠️',
      task_comment: '💬',
      task_status_changed: '🔄',
      project_invitation: '📨',
      project_update: '📁',
      project_member_added: '👥',
      mention: '💬',
      deadline_reminder: '⏰',
      time_entry_reminder: '⏱️',
      system_update: '📢',
      welcome: '👋'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'border-l-gray-300',
      medium: 'border-l-blue-400',
      high: 'border-l-orange-400',
      urgent: 'border-l-red-500'
    };
    return colors[priority] || 'border-l-gray-300';
  };

  const handleClick = () => {
    if (notification.status !== 'read') {
      onMarkAsRead([notification._id]);
    }
    
    if (notification.data?.url) {
      onNavigate(notification.data.url);
    }
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    onMarkAsRead([notification._id]);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <div
      className={cn(
        "p-4 border-l-4 hover:bg-base-200 transition-colors cursor-pointer",
        getPriorityColor(notification.priority),
        notification.status === 'read' ? 'opacity-75' : 'bg-base-50'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={cn(
                "font-medium text-sm",
                notification.status === 'read' ? 'text-base-content/70' : 'text-base-content'
              )}>
                {notification.title}
              </h4>
              <p className={cn(
                "text-sm mt-1",
                notification.status === 'read' ? 'text-base-content/60' : 'text-base-content/80'
              )}>
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-3 mt-2 text-xs text-base-content/60">
                <span>{formatDate(notification.createdAt)}</span>
                {notification.sender && (
                  <span>by {notification.sender.name}</span>
                )}
                {notification.priority === 'urgent' && (
                  <span className="badge badge-error badge-xs">Urgent</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {notification.status !== 'read' && (
                <button
                  onClick={handleMarkAsRead}
                  className="btn btn-ghost btn-xs"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                </button>
              )}
              
              {notification.data?.url && (
                <button
                  onClick={handleClick}
                  className="btn btn-ghost btn-xs"
                  title="Open"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              <div className="dropdown dropdown-end">
                <button
                  tabIndex={0}
                  className="btn btn-ghost btn-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                {showMenu && (
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                    {notification.status !== 'read' && (
                      <li>
                        <button onClick={handleMarkAsRead}>
                          <Check className="w-4 h-4" />
                          Mark as read
                        </button>
                      </li>
                    )}
                    <li>
                      <button onClick={handleDelete} className="text-error">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', { unreadOnly: filter === 'unread' }],
    queryFn: () => notificationsAPI.getNotifications({
      unreadOnly: filter === 'unread',
      limit: 50
    }).then(res => res.data),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount().then(res => res.data),
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.data?.count || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds) => notificationsAPI.markAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
    onError: (error) => {
      toast.error('Failed to mark notifications as read');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error('Failed to mark all notifications as read');
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => notificationsAPI.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete notification');
    }
  });

  const handleMarkAsRead = (notificationIds) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleNavigate = (url) => {
    setIsOpen(false);
    navigate(url);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="dropdown dropdown-end">
        <button
          tabIndex={0}
          className="btn btn-ghost btn-circle"
          onClick={handleToggle}
        >
          <div className="indicator">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="badge badge-xs badge-primary indicator-item">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div
            tabIndex={0}
            className="dropdown-content z-[1] card card-compact w-96 max-w-[90vw] p-0 shadow-xl bg-base-100 border border-base-300"
          >
            <div className="card-body p-0">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-base-300">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="btn btn-ghost btn-sm"
                      disabled={markAllAsReadMutation.isPending}
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowSettings(true)}
                    className="btn btn-ghost btn-sm"
                    title="Notification settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="tabs tabs-boxed m-4 mb-0">
                <button
                  className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`tab ${filter === 'unread' ? 'tab-active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="loading loading-spinner loading-md"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-base-300">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="text-center p-4 border-t border-base-300">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <NotificationSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

// Notification Settings Component
const NotificationSettings = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({});

  // Fetch preferences
  const { data: preferencesData, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsAPI.getPreferences().then(res => res.data.data),
    enabled: isOpen
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences) => notificationsAPI.updatePreferences(newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Notification preferences updated');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
    }
  });

  useEffect(() => {
    if (preferencesData) {
      setPreferences(preferencesData);
    }
  }, [preferencesData]);

  const handlePreferenceChange = (type, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value
      }
    }));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate({ preferences });
  };

  if (!isOpen) return null;

  const notificationTypes = [
    { key: 'task_assigned', label: 'Task Assigned' },
    { key: 'task_completed', label: 'Task Completed' },
    { key: 'task_overdue', label: 'Task Overdue' },
    { key: 'task_comment', label: 'Task Comments' },
    { key: 'project_invitation', label: 'Project Invitations' },
    { key: 'mention', label: 'Mentions' },
    { key: 'deadline_reminder', label: 'Deadline Reminders' },
    { key: 'system_update', label: 'System Updates' }
  ];

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Notification Preferences</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Notification Type</th>
                    <th>In-App</th>
                    <th>Email</th>
                    <th>Push</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationTypes.map(({ key, label }) => (
                    <tr key={key}>
                      <td className="font-medium">{label}</td>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={preferences[key]?.inApp || false}
                          onChange={(e) => handlePreferenceChange(key, 'inApp', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={preferences[key]?.email || false}
                          onChange={(e) => handlePreferenceChange(key, 'email', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={preferences[key]?.push || false}
                          onChange={(e) => handlePreferenceChange(key, 'push', e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-action">
              <button
                onClick={onClose}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updatePreferencesMutation.isPending}
                className="btn btn-primary"
              >
                {updatePreferencesMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;