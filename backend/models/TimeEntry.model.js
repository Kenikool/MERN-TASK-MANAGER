import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isManual: {
    type: Boolean,
    default: false
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  billable: {
    type: Boolean,
    default: true
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    browser: String,
    device: String,
    location: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ task: 1 });
timeEntrySchema.index({ project: 1 });
timeEntrySchema.index({ isRunning: 1 });
timeEntrySchema.index({ startTime: 1, endTime: 1 });

// Virtual for formatted duration
timeEntrySchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Virtual for earnings (if billable)
timeEntrySchema.virtual('earnings').get(function() {
  if (!this.billable || !this.hourlyRate) return 0;
  return (this.duration / 3600) * this.hourlyRate;
});

// Calculate duration before saving
timeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Prevent overlapping time entries for the same user
timeEntrySchema.pre('save', async function(next) {
  if (this.isNew && this.isRunning) {
    // Stop any other running timers for this user
    await this.constructor.updateMany(
      { 
        user: this.user, 
        isRunning: true,
        _id: { $ne: this._id }
      },
      { 
        endTime: this.startTime,
        isRunning: false
      }
    );
  }
  next();
});

// Update task's actual hours when time entry is saved
timeEntrySchema.post('save', async function() {
  if (this.endTime && !this.isRunning) {
    const Task = mongoose.model('Task');
    
    // Calculate total time for this task
    const totalTime = await this.constructor.aggregate([
      { $match: { task: this.task, endTime: { $exists: true } } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);

    const totalHours = totalTime.length > 0 ? totalTime[0].totalDuration / 3600 : 0;
    
    await Task.findByIdAndUpdate(this.task, {
      actualHours: Math.round(totalHours * 100) / 100 // Round to 2 decimal places
    });
  }
});

// Static methods
timeEntrySchema.statics.getActiveTimer = function(userId) {
  return this.findOne({
    user: userId,
    isRunning: true
  })
  .populate('task', 'title')
  .populate('project', 'name color');
};

timeEntrySchema.statics.getUserTimeStats = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        startTime: { $gte: startDate, $lte: endDate },
        endTime: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: '$duration' },
        totalEntries: { $sum: 1 },
        billableDuration: {
          $sum: { $cond: ['$billable', '$duration', 0] }
        },
        totalEarnings: {
          $sum: { 
            $cond: [
              '$billable', 
              { $multiply: [{ $divide: ['$duration', 3600] }, '$hourlyRate'] },
              0
            ]
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalDuration: 0,
    totalEntries: 0,
    billableDuration: 0,
    totalEarnings: 0
  };
};

timeEntrySchema.statics.getProjectTimeStats = async function(projectId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
        startTime: { $gte: startDate, $lte: endDate },
        endTime: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$user',
        totalDuration: { $sum: '$duration' },
        totalEntries: { $sum: 1 },
        billableDuration: {
          $sum: { $cond: ['$billable', '$duration', 0] }
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
          avatar: '$user.avatar'
        },
        totalDuration: 1,
        totalEntries: 1,
        billableDuration: 1,
        totalHours: { $divide: ['$totalDuration', 3600] },
        billableHours: { $divide: ['$billableDuration', 3600] }
      }
    }
  ];

  return this.aggregate(pipeline);
};

export default mongoose.model('TimeEntry', timeEntrySchema);