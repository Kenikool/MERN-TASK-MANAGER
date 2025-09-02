import Task from '../models/Task.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';

// Get all tasks with filtering and pagination
export const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      project,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (project) filter.project = project;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'member') {
      filter.assignedTo = req.user.id;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'project', select: 'name color' },
        { path: 'createdBy', select: 'name email' }
      ]
    };

    // Simple find without pagination for now
    const tasks = await Task.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate([
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'project', select: 'name color' },
        { path: 'createdBy', select: 'name email' }
      ]);

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tasks: tasks,
        total: total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting tasks'
    });
  }
};

// Get single task by ID
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color members')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (req.user.role === 'member' && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting task'
    });
  }
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'todo',
      priority = 'medium',
      assignedTo,
      project,
      dueDate,
      tags,
      checklist,
      estimatedHours
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Check if project exists and user has access
    if (project) {
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user is member of the project
      const isMember = projectDoc.members.some(
        member => member.user.toString() === req.user.id
      );
      
      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this project'
        });
      }
    }

    // Validate assignedTo user exists
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      assignedTo: assignedTo || req.user.id,
      project,
      dueDate,
      tags,
      checklist,
      estimatedHours,
      createdBy: req.user.id
    });

    // Populate the created task
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'project', select: 'name color' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.role === 'member' && 
        task.assignedTo.toString() !== req.user.id && 
        task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'project', select: 'name color' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions - only admin, manager, or task creator can delete
    if (req.user.role === 'member' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update status and completion date if completed
    const updateData = { status, updatedBy: req.user.id };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'project', select: 'name color' }
    ]);

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task status'
    });
  }
};

// Add comment to task
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = {
      content,
      author: req.user.id,
      createdAt: new Date()
    };

    task.comments.push(comment);
    await task.save();

    // Populate the new comment
    await task.populate('comments.author', 'name email avatar');
    
    const newComment = task.comments[task.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
};

// Toggle checklist item
export const toggleChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params;
    
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const checklistItem = task.checklist.id(itemId);
    
    if (!checklistItem) {
      return res.status(404).json({
        success: false,
        message: 'Checklist item not found'
      });
    }

    checklistItem.completed = !checklistItem.completed;
    checklistItem.completedAt = checklistItem.completed ? new Date() : null;
    
    await task.save();

    res.json({
      success: true,
      message: 'Checklist item updated successfully',
      data: checklistItem
    });
  } catch (error) {
    console.error('Toggle checklist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating checklist item'
    });
  }
};

// Archive/unarchive task
export const archiveTask = async (req, res) => {
  try {
    const { archived } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { archived, updatedBy: req.user.id },
      { new: true }
    ).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'project', select: 'name color' }
    ]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: `Task ${archived ? 'archived' : 'unarchived'} successfully`,
      data: task
    });
  } catch (error) {
    console.error('Archive task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error archiving task'
    });
  }
};