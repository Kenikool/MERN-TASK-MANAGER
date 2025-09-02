import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getDashboardAnalytics,
  getProjectAnalytics,
  getUserAnalytics,
  getSystemAnalytics
} from "../controllers/analytics.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard analytics
router.get("/dashboard", getDashboardAnalytics);

// Project analytics
router.get("/projects/:id", getProjectAnalytics);

// User analytics
router.get("/users/:id", getUserAnalytics);

// System analytics (admin only)
router.get("/system", getSystemAnalytics);

export default router;