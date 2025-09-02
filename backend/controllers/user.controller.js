import User from '../models/User.model.js';
import Task from '../models/Task.model.js';
import Project from '../models/Project.model.js';
import TimeEntry from '../models/TimeEntry.model.js';
import Notification from '../models/Notification.model.js';

// Get all users with filtering and pagination
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      department,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive = true
    } = req.query;

    // Build filter object
    const filter = { isActive };
    
    if (role) filter.role = role;
    if (department) filter.department = department;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based access control
    if (req.user.role === 'member') {
      // Members can only see users in their projects
      const userProjects = await Project.find({
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      }).select('members.user');

      const projectUserIds = [];
      userProjects.forEach(project => {
        project.members.forEach(member => {
          projectUserIds.push(member.user);
        });
      });

      filter._id = { $in: [...new Set(projectUserIds)] };
    }

    const users = await User.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-password')
      .lean();

    const total = await User.countDocuments(filter);

    // Add task statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const taskStats = await Task.aggregate([
          { $match: { assignedTo: user._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              inProgress: {
                $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
              },
              overdue: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $lt: ['$dueDate', new Date()] },
                        { $ne: ['$status', 'completed'] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]);

        return {
          ...user,
          stats: taskStats[0] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            overdue: 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
};

// Get single user by ID
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions - users can only view their own profile or admins can view all
    if (req.user.id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user's projects
    const projects = await Project.find({
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    })
    .select('name color status')
    .populate('tasksCount')
    .populate('completedTasksCount');

    // Get user's task statistics
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskStatsSummary = {
      total: 0,
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0,
      cancelled: 0
    };

    taskStats.forEach(stat => {
      taskStatsSummary[stat._id] = stat.count;
      taskStatsSummary.total += stat.count;
    });

    // Get recent activity
    const recentTasks = await Task.find({ assignedTo: user._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('project', 'name color')
      .select('title status priority updatedAt dueDate');

    // Get time tracking stats for current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    const timeStats = await TimeEntry.getUserTimeStats(user._id, startOfMonth, endOfMonth);

    res.json({
      success: true,
      data: {
        ...user,
        projects,
        taskStats: taskStatsSummary,
        recentTasks,
        timeStats
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user'
    });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    // Only admin can update other users
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update other users.'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent non-admins from changing role
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can delete users.'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete yourself
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has assigned tasks
    const taskCount = await Task.countDocuments({ assignedTo: req.params.id });
    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${taskCount} assigned tasks. Please reassign tasks first.`
      });
    }

    // Check if user owns projects
    const projectCount = await Project.countDocuments({ owner: req.params.id });
    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user who owns ${projectCount} projects. Please transfer ownership first.`
      });
    }

    // Deactivate instead of deleting to preserve data integrity
    await User.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
};

// Get user dashboard data
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    
    // Check permissions
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user's task statistics
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskStatsSummary = {
      total: 0,
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0,
      overdue: 0
    };

    taskStats.forEach(stat => {
      taskStatsSummary[stat._id] = stat.count;
      taskStatsSummary.total += stat.count;
    });

    // Get overdue tasks count
    const overdueCount = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });
    taskStatsSummary.overdue = overdueCount;

    // Get user's projects
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    })
    .select('name color status')
    .populate('tasksCount')
    .populate('completedTasksCount')
    .limit(5);

    // Get recent tasks
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('project', 'name color')
      .select('title status priority updatedAt dueDate');

    // Get upcoming deadlines
    const upcomingDeadlines = await Task.find({
      assignedTo: userId,
      dueDate: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      },
      status: { $ne: 'completed' }
    })
    .sort({ dueDate: 1 })
    .limit(5)
    .populate('project', 'name color')
    .select('title priority dueDate');

    // Get time tracking stats for current week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weeklyTimeStats = await TimeEntry.getUserTimeStats(userId, startOfWeek, endOfWeek);

    // Get productivity metrics
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completedTasksLast30Days = await Task.countDocuments({
      assignedTo: userId,
      status: 'completed',
      completedDate: { $gte: last30Days }
    });

    // Calculate productivity score (simple algorithm)
    const productivityScore = Math.min(100, Math.round(
      (completedTasksLast30Days * 10) + 
      (weeklyTimeStats.totalDuration / 3600 * 2) - 
      (overdueCount * 5)
    ));

    res.json({
      success: true,
      data: {
        taskStats: taskStatsSummary,
        projects,
        recentTasks,
        upcomingDeadlines,
        weeklyTimeStats,
        productivity: {
          score: Math.max(0, productivityScore),
          completedTasksLast30Days,
          weeklyHours: Math.round(weeklyTimeStats.totalDuration / 3600 * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user dashboard'
    });
  }
};

// Get team members
export const getTeamMembers = async (req, res) => {
  try {
    const {
      projectId,
      department,
      role,
      search,
      limit = 50
    } = req.query;

    let filter = { isActive: true };
    
    if (department) filter.department = department;
    if (role) filter.role = role;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // If projectId is provided, get members of that specific project
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has access to this project
      if (!project.isMember(req.user.id) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const memberIds = project.members.map(member => member.user);
      filter._id = { $in: memberIds };
    } else {
      // Role-based filtering for general team members
      if (req.user.role === 'member') {
        // Members can only see users in their projects
        const userProjects = await Project.find({
          $or: [
            { owner: req.user.id },
            { 'members.user': req.user.id }
          ]
        }).select('members.user');

        const projectUserIds = [];
        userProjects.forEach(project => {
          project.members.forEach(member => {
            projectUserIds.push(member.user);
          });
        });

        filter._id = { $in: [...new Set(projectUserIds)] };
      }
    }

    const teamMembers = await User.find(filter)
      .select('name email avatar role department position isActive lastLogin')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    // Add current task count for each member
    const membersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        const currentTasks = await Task.countDocuments({
          assignedTo: member._id,
          status: { $in: ['todo', 'in-progress', 'review'] }
        });

        return {
          ...member,
          currentTasks
        };
      })
    );

    res.json({
      success: true,
      data: membersWithStats
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting team members'
    });
  }
};

// Get user activity feed
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    // Check permissions
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get recent task activities
    const recentTasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { createdBy: userId },
        { 'comments.author': userId }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .populate('project', 'name color')
    .populate('assignedTo', 'name avatar')
    .populate('createdBy', 'name avatar')
    .select('title status priority updatedAt createdAt comments');

    // Get recent time entries
    const recentTimeEntries = await TimeEntry.find({ user: userId })
      .sort({ startTime: -1 })
      .limit(10)
      .populate('task', 'title')
      .populate('project', 'name color')
      .select('startTime endTime duration description');

    // Format activity feed
    const activities = [];

    // Add task activities
    recentTasks.forEach(task => {
      activities.push({
        type: 'task_updated',
        timestamp: task.updatedAt,
        data: {
          task: {
            id: task._id,
            title: task.title,
            status: task.status,
            priority: task.priority
          },
          project: task.project
        }
      });
    });

    // Add time tracking activities
    recentTimeEntries.forEach(entry => {
      if (entry.endTime) {
        activities.push({
          type: 'time_logged',
          timestamp: entry.endTime,
          data: {
            duration: entry.duration,
            task: entry.task,
            project: entry.project,
            description: entry.description
          }
        });
      }
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user activity'
    });
  }
};