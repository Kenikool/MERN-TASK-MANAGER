import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  attachments: [{
    url: String,
    publicId: String,
    filename: String,
    fileType: String
  }]
}, {
  timestamps: true
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  image: {
    url: String,
    publicId: String,
    filename: String
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  dueDate: {
    type: Date
  },
  startDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  attachments: [{
    url: String,
    publicId: String,
    filename: String,
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  checklist: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date
  }],
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked-by', 'related'],
      default: 'related'
    }
  }],
  labels: [{
    name: String,
    color: String
  }],
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select']
    }
  }],
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ collaborators: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage based on checklist
taskSchema.virtual('completionPercentage').get(function() {
  if (!this.checklist || this.checklist.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  
  const completedItems = this.checklist.filter(item => item.completed).length;
  return Math.round((completedItems / this.checklist.length) * 100);
});

// Virtual for time tracking
taskSchema.virtual('timeTracking').get(function() {
  return {
    estimated: this.estimatedHours || 0,
    actual: this.actualHours || 0,
    remaining: Math.max(0, (this.estimatedHours || 0) - (this.actualHours || 0)),
    variance: (this.actualHours || 0) - (this.estimatedHours || 0)
  };
});

// Pre-save middleware to update completion date
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedDate) {
      this.completedDate = new Date();
    } else if (this.status !== 'completed') {
      this.completedDate = undefined;
    }
  }
  next();
});

// Method to check if user can edit task
taskSchema.methods.canEdit = function(userId, userRole) {
  // Admin can edit any task
  if (userRole === 'admin') return true;
  
  // Creator can edit their own tasks
  if (this.createdBy.toString() === userId.toString()) return true;
  
  // Assigned user can edit the task
  if (this.assignedTo && this.assignedTo.toString() === userId.toString()) return true;
  
  // Collaborators can edit the task
  if (this.collaborators.some(collab => collab.toString() === userId.toString())) return true;
  
  return false;
};

// Method to add comment
taskSchema.methods.addComment = function(userId, text, attachments = []) {
  this.comments.push({
    user: userId,
    text: text,
    attachments: attachments
  });
  return this.save();
};

// Method to update status with validation
taskSchema.methods.updateStatus = function(newStatus, userId) {
  const validTransitions = {
    'todo': ['in-progress', 'cancelled'],
    'in-progress': ['review', 'completed', 'todo', 'cancelled'],
    'review': ['completed', 'in-progress', 'cancelled'],
    'completed': ['review'],
    'cancelled': ['todo']
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedDate = new Date();
  }
  
  return this.save();
};

// Method to add to checklist
taskSchema.methods.addChecklistItem = function(text) {
  this.checklist.push({ text: text });
  return this.save();
};

// Method to toggle checklist item
taskSchema.methods.toggleChecklistItem = function(itemId, userId) {
  const item = this.checklist.id(itemId);
  if (!item) throw new Error('Checklist item not found');
  
  item.completed = !item.completed;
  if (item.completed) {
    item.completedBy = userId;
    item.completedAt = new Date();
  } else {
    item.completedBy = undefined;
    item.completedAt = undefined;
  }
  
  return this.save();
};

export default mongoose.model('Task', taskSchema);