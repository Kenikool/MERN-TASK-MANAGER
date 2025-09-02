import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getProjectTasks,
  getProjectAnalytics
} from "../controllers/project.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project CRUD operations
router.route("/")
  .get(getProjects)
  .post(createProject);

router.route("/:id")
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Project member management
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);
router.patch("/:id/members/:userId", updateMemberRole);

// Project tasks
router.get("/:id/tasks", getProjectTasks);

// Project analytics
router.get("/:id/analytics", getProjectAnalytics);

export default router;
