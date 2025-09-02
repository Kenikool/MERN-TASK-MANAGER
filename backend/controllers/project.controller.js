import Project from '../models/Project.model.js';
import Task from '../models/Task.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';

// Get all projects with filtering and pagination
export const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeArchived = false
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering - users can only see projects they're members of
    if (req.user.role !== 'admin') {
      filter.$or = [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ];
    }

    const projects = await Project.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('tasksCount')
      .populate('completedTasksCount');

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: {
        projects: projects,
        total: total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting projects'
    });
  }
};

// Get single project by ID
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role department')
      .populate('tasksCount')
      .populate('completedTasksCount');

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

    // Get recent activity for this project
    const recentTasks = await Task.find({ project: project._id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name avatar')
      .select('title status priority updatedAt');

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        recentTasks
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting project'
    });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status = 'planning',
      priority = 'medium',
      startDate,
      endDate,
      budget,
      tags,
      color = '#3B82F6',
      settings = {}
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user.id,
      status,
      priority,
      startDate,
      endDate,
      budget,
      tags,
      color,
      settings,
      members: [{
        user: req.user.id,
        role: 'owner',
        joinedAt: new Date()
      }]
    });

    // Populate the created project
    await project.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating project'
    });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions - only owner or admin can update
    if (!project.hasAdminAccess(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project admins can update projects.'
      });
    }

    // Validate dates if provided
    if (req.body.startDate && req.body.endDate && 
        new Date(req.body.startDate) > new Date(req.body.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' }
    ]);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating project'
    });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions - only owner or admin can delete
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner can delete projects.'
      });
    }

    // Check if project has tasks
    const taskCount = await Task.countDocuments({ project: req.params.id });
    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete project with ${taskCount} tasks. Please delete or move tasks first.`
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting project'
    });
  }
};

// Add member to project
export const addMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    if (!project.hasAdminAccess(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project admins can add members.'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    if (project.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    await project.addMember(userId, role);
    
    // Send notification to the new member
    await Notification.notifyProjectInvitation(project, user, req.user);

    // Populate and return updated project
    await project.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Member added successfully',
      data: project
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding member'
    });
  }
};

// Remove member from project
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    if (!project.hasAdminAccess(req.user.id) && req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot remove project owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    // Check if user is a member
    if (!project.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this project'
      });
    }

    // Remove member
    await project.removeMember(userId);

    // Reassign tasks if user has any tasks in this project
    await Task.updateMany(
      { project: req.params.id, assignedTo: userId },
      { $unset: { assignedTo: 1 } }
    );

    await project.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: project
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing member'
    });
  }
};

// Update member role
export const updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions - only owner can change roles
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner can change member roles.'
      });
    }

    // Cannot change owner role
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change project owner role'
      });
    }

    // Update member role
    await project.updateMemberRole(userId, role);
    await project.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating member role'
    });
  }
};

// Get project tasks
export const getProjectTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const project = await Project.findById(req.params.id);
    
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

    // Build filter object
    const filter = { project: req.params.id };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');

    const total = await Task.countDocuments(filter);

    // Get task statistics
    const stats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskStats = {
      total: await Task.countDocuments({ project: project._id }),
      todo: 0,
      'in-progress': 0,
      review: 0,
      completed: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      taskStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: tasks,
      stats: taskStats,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting project tasks'
    });
  }
};

// Get project analytics
export const getProjectAnalytics = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
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

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
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
          },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          totalActualHours: { $sum: '$actualHours' }
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
          totalHours: { $sum: '$actualHours' }
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

    const analytics = {
      overview: taskStats[0] || {
        total: 0,
        completed: 0,
        overdue: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0
      },
      statusDistribution,
      priorityDistribution,
      memberProductivity,
      progress: project.progress || 0
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting project analytics'
    });
  }
};