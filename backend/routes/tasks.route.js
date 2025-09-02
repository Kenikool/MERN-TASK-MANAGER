import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  toggleChecklistItem,
  archiveTask
} from "../controllers/task.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Task CRUD operations
router.route("/")
  .get(getTasks)
  .post(createTask);

router.route("/:id")
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Task status updates
router.patch("/:id/status", updateTaskStatus);

// Task comments
router.post("/:id/comments", addComment);

// Checklist items
router.patch("/:taskId/checklist/:itemId", toggleChecklistItem);

// Archive/unarchive
router.patch("/:id/archive", archiveTask);

export default router;