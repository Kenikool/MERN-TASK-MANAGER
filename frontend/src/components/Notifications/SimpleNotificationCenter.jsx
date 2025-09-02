import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

const SimpleNotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: 'Task Assigned',
      message: 'You have been assigned to "Update user interface"',
      time: '2 min ago',
      type: 'task_assigned',
      read: false
    },
    {
      id: 2,
      title: 'Project Update',
      message: 'Mobile App project has been updated',
      time: '1 hour ago',
      type: 'project_update',
      read: false
    },
    {
      id: 3,
      title: 'Task Completed',
      message: 'Database optimization task was completed',
      time: '3 hours ago',
      type: 'task_completed',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: '🎯',
      task_completed: '✅',
      task_overdue: '⚠️',
      project_update: '📁',
      mention: '💬'
    };
    return icons[type] || '🔔';
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
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

      {isOpen && (
        <div
          tabIndex={0}
          className="dropdown-content z-[1] card card-compact w-96 max-w-[90vw] p-0 shadow-xl bg-base-100 border border-base-300"
        >
          <div className="card-body p-0">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-base-300">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-base-300">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-base-200 transition-colors cursor-pointer ${
                        notification.read ? 'opacity-75' : 'bg-base-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm ${
                            notification.read ? 'text-base-content/70' : 'text-base-content'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            notification.read ? 'text-base-content/60' : 'text-base-content/80'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="text-xs text-base-content/60 mt-2">
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    </div>
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
                    // Navigate to notifications page
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
  );
};

export default SimpleNotificationCenter;