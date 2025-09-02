import express from "express";
import { protect } from "../middleware/auth.js";
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTimeEntries,
  createManualEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeStats
} from "../controllers/timeTracking.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Timer operations
router.post("/start", startTimer);
router.patch("/stop/:id", stopTimer);
router.get("/active", getActiveTimer);

// Time entries CRUD
router.route("/entries")
  .get(getTimeEntries)
  .post(createManualEntry);

router.route("/entries/:id")
  .put(updateTimeEntry)
  .delete(deleteTimeEntry);

// Time statistics
router.get("/stats", getTimeStats);

export default router;
