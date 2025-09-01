import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_completed',
      'task_overdue',
      'task_comment',
      'task_status_changed',
      'project_invitation',
      'project_update',
      'project_member_added',
      'mention',
      'deadline_reminder',
      'time_entry_reminder',
      'system_update',
      'welcome'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId
    },
    timeEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeEntry'
    },
    url: String,
    actionText: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  readAt: Date,
  sentAt: Date,
  deliveredAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  scheduledFor: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'data.taskId': 1 });
notificationSchema.index({ 'data.projectId': 1 });
notificationSchema.index({ scheduledFor: 1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Virtual for checking if notification is recent
notificationSchema.virtual('isRecent').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  return diff < 24 * 60 * 60 * 1000; // 24 hours
});

// Pre-save middleware to set scheduled notifications
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.scheduledFor) {
    this.scheduledFor = new Date();
  }
  next();
});

// Static methods
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = await this.create(notificationData);
    
    // Emit socket event for real-time delivery
    const socketServer = global.socketServer;
    if (socketServer && notification.channels.inApp) {
      socketServer.emitNotification(notification.recipient, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt
      });
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      status: { $ne: 'read' }
    },
    {
      status: 'read',
      readAt: new Date()
    }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: { $ne: 'read' }
  });
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    status,
    unreadOnly = false,
    priority
  } = options;

  const query = { recipient: userId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (unreadOnly) query.status = { $ne: 'read' };
  if (priority) query.priority = priority;

  const notifications = await this.find(query)
    .populate('sender', 'name avatar email')
    .populate('data.taskId', 'title status priority')
    .populate('data.projectId', 'name color')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await this.countDocuments(query);
  const unreadCount = await this.getUnreadCount(userId);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  };
};

// Notification factory methods
notificationSchema.statics.notifyTaskAssigned = async function(task, assignee, assigner) {
  return this.createNotification({
    recipient: assignee._id,
    sender: assigner._id,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned to "${task.title}"`,
    data: {
      taskId: task._id,
      projectId: task.project,
      url: `/tasks/${task._id}`,
      actionText: 'View Task'
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    },
    priority: task.priority === 'urgent' ? 'urgent' : 'medium'
  });
};

notificationSchema.statics.notifyTaskCompleted = async function(task, completedBy, recipients) {
  const notifications = recipients.map(recipient => 
    this.createNotification({
      recipient: recipient._id,
      sender: completedBy._id,
      type: 'task_completed',
      title: 'Task Completed',
      message: `"${task.title}" has been completed by ${completedBy.name}`,
      data: {
        taskId: task._id,
        projectId: task.project,
        url: `/tasks/${task._id}`,
        actionText: 'View Task'
      },
      channels: {
        inApp: true,
        email: false,
        push: true
      },
      priority: 'low'
    })
  );

  return Promise.all(notifications);
};

notificationSchema.statics.notifyTaskOverdue = async function(task) {
  if (!task.assignedTo) return;

  return this.createNotification({
    recipient: task.assignedTo,
    type: 'task_overdue',
    title: 'Task Overdue',
    message: `"${task.title}" is overdue and needs attention`,
    data: {
      taskId: task._id,
      projectId: task.project,
      url: `/tasks/${task._id}`,
      actionText: 'Update Task'
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    },
    priority: 'urgent'
  });
};

notificationSchema.statics.notifyTaskComment = async function(task, comment, commenter, recipients) {
  const notifications = recipients
    .filter(recipient => recipient._id.toString() !== commenter._id.toString())
    .map(recipient => 
      this.createNotification({
        recipient: recipient._id,
        sender: commenter._id,
        type: 'task_comment',
        title: 'New Comment',
        message: `${commenter.name} commented on "${task.title}"`,
        data: {
          taskId: task._id,
          projectId: task.project,
          commentId: comment._id,
          url: `/tasks/${task._id}#comment-${comment._id}`,
          actionText: 'View Comment'
        },
        channels: {
          inApp: true,
          email: true,
          push: false
        },
        priority: 'low'
      })
    );

  return Promise.all(notifications);
};

notificationSchema.statics.notifyMention = async function(mentionedUser, mentioner, context) {
  return this.createNotification({
    recipient: mentionedUser._id,
    sender: mentioner._id,
    type: 'mention',
    title: 'You were mentioned',
    message: `${mentioner.name} mentioned you in ${context.type}`,
    data: {
      taskId: context.taskId,
      projectId: context.projectId,
      commentId: context.commentId,
      url: context.url,
      actionText: 'View'
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    },
    priority: 'medium'
  });
};

notificationSchema.statics.notifyProjectInvitation = async function(project, invitee, inviter) {
  return this.createNotification({
    recipient: invitee._id,
    sender: inviter._id,
    type: 'project_invitation',
    title: 'Project Invitation',
    message: `${inviter.name} invited you to join "${project.name}"`,
    data: {
      projectId: project._id,
      url: `/projects/${project._id}`,
      actionText: 'View Project'
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    },
    priority: 'medium'
  });
};

notificationSchema.statics.notifyDeadlineReminder = async function(task, reminderType = '24h') {
  if (!task.assignedTo) return;

  const reminderMessages = {
    '24h': 'is due in 24 hours',
    '1h': 'is due in 1 hour',
    'overdue': 'is now overdue'
  };

  return this.createNotification({
    recipient: task.assignedTo,
    type: 'deadline_reminder',
    title: 'Deadline Reminder',
    message: `"${task.title}" ${reminderMessages[reminderType]}`,
    data: {
      taskId: task._id,
      projectId: task.project,
      url: `/tasks/${task._id}`,
      actionText: 'Update Task',
      reminderType
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    },
    priority: reminderType === 'overdue' ? 'urgent' : 'high'
  });
};

export default mongoose.model('Notification', notificationSchema);