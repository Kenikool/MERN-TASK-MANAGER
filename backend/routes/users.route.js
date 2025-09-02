import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserDashboard,
  getTeamMembers,
  getUserActivity
} from "../controllers/user.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User CRUD operations
router.route("/")
  .get(getUsers);

router.route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(authorize('admin'), deleteUser);

// User dashboard
router.get("/:id/dashboard", getUserDashboard);
router.get("/dashboard", getUserDashboard); // For current user

// Team members
router.get("/team/members", getTeamMembers);

// User activity
router.get("/:id/activity", getUserActivity);
router.get("/activity", getUserActivity); // For current user

export default router;
