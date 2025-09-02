import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  updatePreferences,
  getPreferences,
  getNotificationStats,
  sendTestNotification
} from "../controllers/notification.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Notification CRUD
router.route("/")
  .get(getNotifications)
  .post(authorize('admin'), createNotification);

router.delete("/:id", deleteNotification);

// Notification actions
router.get("/unread-count", getUnreadCount);
router.patch("/mark-read", markAsRead);
router.patch("/mark-all-read", markAllAsRead);

// Notification preferences
router.route("/preferences")
  .get(getPreferences)
  .put(updatePreferences);

// Admin routes
router.get("/stats", authorize('admin'), getNotificationStats);
router.post("/test", authorize('admin'), sendTestNotification);

export default router;