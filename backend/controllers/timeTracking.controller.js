import TimeEntry from '../models/TimeEntry.model.js';
import Task from '../models/Task.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import mongoose from 'mongoose';

// Start timer for a task
export const startTimer = async (req, res) => {
  try {
    const { taskId, description, billable = true } = req.body;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Check if task exists and user has access
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (task.assignedTo?.toString() !== req.user.id && 
        task.createdBy?.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if user already has an active timer
    const activeTimer = await TimeEntry.findOne({
      user: req.user.id,
      isRunning: true
    });

    if (activeTimer) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active timer. Please stop it first.',
        data: { activeTimer }
      });
    }

    // Create new time entry
    const timeEntry = await TimeEntry.create({
      user: req.user.id,
      task: taskId,
      project: task.project._id,
      startTime: new Date(),
      description,
      billable,
      isRunning: true,
      hourlyRate: req.user.hourlyRate || 0
    });

    // Populate the created entry
    await timeEntry.populate([
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name color' },
      { path: 'user', select: 'name avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      data: timeEntry
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting timer'
    });
  }
};

// Stop active timer
export const stopTimer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const timeEntry = await TimeEntry.findOne({
      _id: id,
      user: req.user.id,
      isRunning: true
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Active timer not found'
      });
    }

    // Stop the timer
    timeEntry.endTime = new Date();
    timeEntry.isRunning = false;
    
    // Duration will be calculated by the pre-save middleware
    await timeEntry.save();

    // Populate the stopped entry
    await timeEntry.populate([
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name color' },
      { path: 'user', select: 'name avatar' }
    ]);

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      data: timeEntry
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error stopping timer'
    });
  }
};

// Get active timer for current user
export const getActiveTimer = async (req, res) => {
  try {
    const activeTimer = await TimeEntry.getActiveTimer(req.user.id);

    res.json({
      success: true,
      data: activeTimer
    });
  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting active timer'
    });
  }
};

// Get time entries with filtering and pagination
export const getTimeEntries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      taskId,
      projectId,
      userId,
      billable,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'member') {
      filter.user = req.user.id;
    } else if (userId) {
      filter.user = userId;
    }
    
    if (taskId) filter.task = taskId;
    if (projectId) filter.project = projectId;
    if (billable !== undefined) filter.billable = billable === 'true';
    
    // Date range filtering
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Only show completed entries (not running)
    filter.endTime = { $exists: true };

    const timeEntries = await TimeEntry.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('task', 'title status priority')
      .populate('project', 'name color')
      .populate('user', 'name avatar');

    const total = await TimeEntry.countDocuments(filter);

    // Calculate totals for the filtered entries
    const totals = await TimeEntry.aggregate([
      { $match: filter },
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
    ]);

    res.json({
      success: true,
      data: timeEntries,
      totals: totals[0] || {
        totalDuration: 0,
        totalEntries: 0,
        billableDuration: 0,
        totalEarnings: 0
      },
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting time entries'
    });
  }
};

// Create manual time entry
export const createManualEntry = async (req, res) => {
  try {
    const {
      taskId,
      startTime,
      endTime,
      description,
      billable = true
    } = req.body;
    
    if (!taskId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Task ID, start time, and end time are required'
      });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check if task exists and user has access
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (task.assignedTo?.toString() !== req.user.id && 
        task.createdBy?.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check for overlapping entries
    const overlapping = await TimeEntry.findOne({
      user: req.user.id,
      $or: [
        {
          startTime: { $lte: start },
          endTime: { $gte: start }
        },
        {
          startTime: { $lte: end },
          endTime: { $gte: end }
        },
        {
          startTime: { $gte: start },
          endTime: { $lte: end }
        }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Time entry overlaps with existing entry'
      });
    }

    // Create manual time entry
    const timeEntry = await TimeEntry.create({
      user: req.user.id,
      task: taskId,
      project: task.project._id,
      startTime: start,
      endTime: end,
      description,
      billable,
      isManual: true,
      isRunning: false,
      hourlyRate: req.user.hourlyRate || 0
    });

    // Populate the created entry
    await timeEntry.populate([
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name color' },
      { path: 'user', select: 'name avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Manual time entry created successfully',
      data: timeEntry
    });
  } catch (error) {
    console.error('Create manual entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating manual entry'
    });
  }
};

// Update time entry
export const updateTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    // Check permissions
    if (timeEntry.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot update running timer
    if (timeEntry.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update running timer. Stop it first.'
      });
    }

    // Validate dates if provided
    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }

    const updatedEntry = await TimeEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name color' },
      { path: 'user', select: 'name avatar' }
    ]);

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating time entry'
    });
  }
};

// Delete time entry
export const deleteTimeEntry = async (req, res) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    // Check permissions
    if (timeEntry.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot delete running timer
    if (timeEntry.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete running timer. Stop it first.'
      });
    }

    await TimeEntry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting time entry'
    });
  }
};

// Get time tracking statistics
export const getTimeStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      projectId,
      groupBy = 'day' // day, week, month
    } = req.query;

    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Build filter
    const filter = {
      startTime: { $gte: start, $lte: end },
      endTime: { $exists: true }
    };

    // Role-based filtering
    if (req.user.role === 'member') {
      filter.user = req.user.id;
    } else if (userId) {
      filter.user = new mongoose.Types.ObjectId(userId);
    }
    
    if (projectId) {
      filter.project = new mongoose.Types.ObjectId(projectId);
    }

    // Get overall stats
    const overallStats = await TimeEntry.aggregate([
      { $match: filter },
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
          },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get time distribution by groupBy
    let groupByFormat;
    switch (groupBy) {
      case 'week':
        groupByFormat = {
          year: { $year: '$startTime' },
          week: { $week: '$startTime' }
        };
        break;
      case 'month':
        groupByFormat = {
          year: { $year: '$startTime' },
          month: { $month: '$startTime' }
        };
        break;
      default: // day
        groupByFormat = {
          year: { $year: '$startTime' },
          month: { $month: '$startTime' },
          day: { $dayOfMonth: '$startTime' }
        };
    }

    const timeDistribution = await TimeEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupByFormat,
          totalDuration: { $sum: '$duration' },
          totalEntries: { $sum: 1 },
          billableDuration: {
            $sum: { $cond: ['$billable', '$duration', 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Get project breakdown
    const projectBreakdown = await TimeEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$project',
          totalDuration: { $sum: '$duration' },
          totalEntries: { $sum: 1 },
          billableDuration: {
            $sum: { $cond: ['$billable', '$duration', 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      {
        $unwind: '$project'
      },
      {
        $project: {
          project: {
            _id: '$project._id',
            name: '$project.name',
            color: '$project.color'
          },
          totalDuration: 1,
          totalEntries: 1,
          billableDuration: 1,
          totalHours: { $divide: ['$totalDuration', 3600] },
          billableHours: { $divide: ['$billableDuration', 3600] }
        }
      },
      { $sort: { totalDuration: -1 } }
    ]);

    // Get user breakdown (if admin or manager)
    let userBreakdown = [];
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      userBreakdown = await TimeEntry.aggregate([
        { $match: filter },
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
        },
        { $sort: { totalDuration: -1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalDuration: 0,
          totalEntries: 0,
          billableDuration: 0,
          totalEarnings: 0,
          avgDuration: 0
        },
        timeDistribution,
        projectBreakdown,
        userBreakdown,
        period: {
          startDate: start,
          endDate: end,
          groupBy
        }
      }
    });
  } catch (error) {
    console.error('Get time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting time statistics'
    });
  }
};