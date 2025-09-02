import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// Get notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      unreadOnly = false,
      priority
    } = req.query;

    const result = await Notification.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      unreadOnly: unreadOnly === 'true',
      priority
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting notifications'
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting unread count'
    });
  }
};

// Mark notifications as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    await Notification.markAsRead(notificationIds, req.user.id);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking notifications as read'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking all notifications as read'
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting notification'
    });
  }
};

// Create notification (admin only)
export const createNotification = async (req, res) => {
  try {
    // Only admin can create system notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can create notifications.'
      });
    }

    const {
      recipients, // Array of user IDs or 'all'
      type = 'system_update',
      title,
      message,
      data = {},
      channels = { inApp: true, email: false, push: false },
      priority = 'medium',
      scheduledFor
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    let recipientIds = [];

    if (recipients === 'all') {
      // Send to all active users
      const users = await User.find({ isActive: true }).select('_id');
      recipientIds = users.map(user => user._id);
    } else if (Array.isArray(recipients)) {
      recipientIds = recipients;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Recipients must be an array of user IDs or "all"'
      });
    }

    // Create notifications for all recipients
    const notifications = await Promise.all(
      recipientIds.map(recipientId => 
        Notification.createNotification({
          recipient: recipientId,
          sender: req.user.id,
          type,
          title,
          message,
          data,
          channels,
          priority,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date()
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.length} recipients`,
      data: {
        count: notifications.length,
        type,
        title
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating notification'
    });
  }
};

// Update notification preferences
export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Preferences object is required'
      });
    }

    // Update user's notification preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        'settings.notifications': preferences 
      },
      { new: true }
    ).select('settings.notifications');

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: user.settings.notifications
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating notification preferences'
    });
  }
};

// Get notification preferences
export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings.notifications');

    // Default preferences if not set
    const defaultPreferences = {
      task_assigned: { inApp: true, email: true, push: true },
      task_completed: { inApp: true, email: false, push: false },
      task_overdue: { inApp: true, email: true, push: true },
      task_comment: { inApp: true, email: true, push: false },
      project_invitation: { inApp: true, email: true, push: true },
      mention: { inApp: true, email: true, push: true },
      deadline_reminder: { inApp: true, email: true, push: true },
      system_update: { inApp: true, email: false, push: false }
    };

    const preferences = user.settings?.notifications || defaultPreferences;

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting notification preferences'
    });
  }
};

// Get notification statistics (admin only)
export const getNotificationStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can view notification statistics.'
      });
    }

    const {
      startDate,
      endDate,
      groupBy = 'day' // day, week, month
    } = req.query;

    // Default to last 30 days if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Overall stats
    const overallStats = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          read: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          },
          unread: {
            $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] }
          },
          byPriority: {
            $push: '$priority'
          }
        }
      }
    ]);

    // Notifications by type
    const byType = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          readCount: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          readCount: 1,
          readRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$readCount', '$count'] }, 100] }
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Time distribution
    let groupByFormat;
    switch (groupBy) {
      case 'week':
        groupByFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default: // day
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const timeDistribution = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupByFormat,
          count: { $sum: 1 },
          readCount: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Top recipients
    const topRecipients = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$recipient',
          count: { $sum: 1 },
          readCount: {
            $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email'
          },
          count: 1,
          readCount: 1,
          readRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $multiply: [{ $divide: ['$readCount', '$count'] }, 100] }
            ]
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overall: overallStats[0] || {
          total: 0,
          read: 0,
          unread: 0
        },
        byType,
        timeDistribution,
        topRecipients,
        period: {
          startDate: start,
          endDate: end,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting notification statistics'
    });
  }
};

// Send test notification (admin only)
export const sendTestNotification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can send test notifications.'
      });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await Notification.createNotification({
      recipient: userId,
      sender: req.user.id,
      type: 'system_update',
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system is working correctly.',
      data: {
        isTest: true
      },
      channels: {
        inApp: true,
        email: false,
        push: false
      },
      priority: 'low'
    });

    res.json({
      success: true,
      message: `Test notification sent to ${user.name}`
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending test notification'
    });
  }
};