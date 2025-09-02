import Task from '../models/Task.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build filter based on user role
    let taskFilter = { createdAt: { $gte: startDate } };
    let projectFilter = { createdAt: { $gte: startDate } };

    if (userRole === 'member') {
      taskFilter.assignedTo = userId;
      projectFilter.$or = [
        { owner: userId },
        { 'members.user': userId }
      ];
    }

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', now] },
                    { $ne: ['$status', 'completed'] },
                    { $ne: ['$status', 'cancelled'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalEstimatedHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
          totalActualHours: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      }
    ]);

    // Get project statistics
    const projectStats = await Project.aggregate([
      { $match: projectFilter },
      {
        $group: {
          _id: null,
          activeProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalProjects: { $sum: 1 },
          completedProjects: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get team member count (for admin/manager)
    let teamMembers = 0;
    if (userRole !== 'member') {
      teamMembers = await User.countDocuments({ isActive: true });
    }

    // Get upcoming deadlines
    const upcomingDeadlines = await Task.find({
      ...taskFilter,
      dueDate: { 
        $gte: now, 
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) 
      },
      status: { $nin: ['completed', 'cancelled'] }
    })
    .sort({ dueDate: 1 })
    .limit(5)
    .populate('assignedTo', 'name')
    .populate('project', 'name')
    .select('title dueDate priority status assignedTo project');

    // Get weekly progress data
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyProgress = await Task.aggregate([
      {
        $match: {
          ...taskFilter,
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: {
            $dayOfWeek: '$createdAt'
          },
          planned: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          dayIndex: '$_id',
          planned: 1,
          completed: 1
        }
      }
    ]);

    // Convert to weekly format
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map((day, index) => {
      const dayData = weeklyProgress.find(d => d.dayIndex === index + 1);
      return {
        day: day,
        planned: dayData?.planned || 0,
        completed: dayData?.completed || 0
      };
    });

    const stats = taskStats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0
    };

    const projectData = projectStats[0] || {
      activeProjects: 0,
      totalProjects: 0,
      completedProjects: 0
    };

    // Calculate productivity metrics
    const productivity = stats.totalTasks > 0 ? 
      Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

    const hoursLogged = Math.round(stats.totalActualHours || 0);

    res.json({
      success: true,
      data: {
        stats: {
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          pendingTasks: stats.pendingTasks,
          overdueTasks: stats.overdueTasks,
          activeProjects: projectData.activeProjects,
          teamMembers,
          hoursLogged,
          productivity,
          totalEstimatedHours: stats.totalEstimatedHours,
          totalActualHours: stats.totalActualHours
        },
        weeklyProgress: weeklyData,
        upcomingDeadlines: upcomingDeadlines.map(task => ({
          id: task._id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo?.name,
          project: task.project?.name
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard analytics'
    });
  }
};

// Get project analytics
export const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.isMember(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get task analytics for the project
    const taskAnalytics = await Task.aggregate([
      { $match: { project: project._id, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          todoTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', now] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalHours: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      }
    ]);

    // Get task distribution by status
    const statusDistribution = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get task distribution by priority
    const priorityDistribution = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get member productivity
    const memberProductivity = await Task.aggregate([
      { $match: { project: project._id, assignedTo: { $exists: true } } },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalHours: { $sum: { $ifNull: ['$actualHours', 0] } }
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
          totalTasks: 1,
          completedTasks: 1,
          totalHours: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }
            ]
          }
        }
      }
    ]);

    const analytics = taskAnalytics[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      overdueTasks: 0,
      totalHours: 0
    };

    res.json({
      success: true,
      data: {
        overview: analytics,
        statusDistribution,
        priorityDistribution,
        memberProductivity,
        progress: analytics.totalTasks > 0 ? 
          Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting project analytics'
    });
  }
};

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;

    // Check if user exists and requesting user has access
    if (id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get user task analytics
    const taskAnalytics = await Task.aggregate([
      { 
        $match: { 
          assignedTo: user._id, 
          createdAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', now] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalHours: { $sum: { $ifNull: ['$actualHours', 0] } },
          avgCompletionTime: { $avg: '$actualHours' }
        }
      }
    ]);

    // Get task completion trend (last 30 days)
    const completionTrend = await Task.aggregate([
      {
        $match: {
          assignedTo: user._id,
          status: 'completed',
          completedDate: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedDate'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get projects user is involved in
    const userProjects = await Project.find({
      $or: [
        { owner: user._id },
        { 'members.user': user._id }
      ]
    }).select('name status');

    const analytics = taskAnalytics[0] || {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      totalHours: 0,
      avgCompletionTime: 0
    };

    res.json({
      success: true,
      data: {
        overview: {
          ...analytics,
          completionRate: analytics.totalTasks > 0 ? 
            Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0,
          projectsCount: userProjects.length
        },
        completionTrend,
        projects: userProjects
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user analytics'
    });
  }
};

// Get system analytics (admin only)
export const getSystemAnalytics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get overall system statistics
    const [userStats, taskStats, projectStats] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            newUsers: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0]
              }
            }
          }
        }
      ]),
      
      // Task statistics
      Task.aggregate([
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            newTasks: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0]
              }
            },
            totalHours: { $sum: { $ifNull: ['$actualHours', 0] } }
          }
        }
      ]),
      
      // Project statistics
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completedProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            newProjects: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    // Get user activity trend
    const userActivityTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get task completion trend
    const taskCompletionTrend = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedDate'
            }
          },
          completedTasks: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          users: userStats[0] || { totalUsers: 0, activeUsers: 0, newUsers: 0 },
          tasks: taskStats[0] || { totalTasks: 0, completedTasks: 0, newTasks: 0, totalHours: 0 },
          projects: projectStats[0] || { totalProjects: 0, activeProjects: 0, completedProjects: 0, newProjects: 0 }
        },
        trends: {
          userActivity: userActivityTrend,
          taskCompletion: taskCompletionTrend
        }
      }
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting system analytics'
    });
  }
};