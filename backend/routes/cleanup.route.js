import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";

const router = express.Router();

// Clean up mock URLs in database (admin only)
router.post("/mock-urls", protect, authorize('admin'), async (req, res) => {
  try {
    let cleanupCount = 0;

    // Clean up task images with mock URLs
    const tasksWithMockImages = await Task.find({
      "image.url": { $regex: /localhost:5000\/uploads\/mock-/ }
    });

    for (const task of tasksWithMockImages) {
      task.image = null;
      await task.save();
      cleanupCount++;
    }

    // Clean up user avatars with mock URLs
    const usersWithMockAvatars = await User.find({
      avatar: { $regex: /localhost:5000\/uploads\/mock-/ }
    });

    for (const user of usersWithMockAvatars) {
      user.avatar = null;
      await user.save();
      cleanupCount++;
    }

    // Clean up task attachments with mock URLs
    const tasksWithMockAttachments = await Task.find({
      "attachments.url": { $regex: /localhost:5000\/uploads\/mock-/ }
    });

    for (const task of tasksWithMockAttachments) {
      task.attachments = task.attachments.filter(
        attachment => !attachment.url.includes('localhost:5000/uploads/mock-')
      );
      await task.save();
      cleanupCount++;
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanupCount} mock URLs from database`,
      cleanupCount
    });
  } catch (error) {
    console.error('Cleanup mock URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during cleanup'
    });
  }
});

// Get cleanup statistics
router.get("/stats", protect, authorize('admin'), async (req, res) => {
  try {
    const taskMockImages = await Task.countDocuments({
      "image.url": { $regex: /localhost:5000\/uploads\/mock-/ }
    });

    const userMockAvatars = await User.countDocuments({
      avatar: { $regex: /localhost:5000\/uploads\/mock-/ }
    });

    const taskMockAttachments = await Task.countDocuments({
      "attachments.url": { $regex: /localhost:5000\/uploads\/mock-/ }
    });

    res.json({
      success: true,
      data: {
        taskMockImages,
        userMockAvatars,
        taskMockAttachments,
        total: taskMockImages + userMockAvatars + taskMockAttachments
      }
    });
  } catch (error) {
    console.error('Get cleanup stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting cleanup stats'
    });
  }
});

export default router;