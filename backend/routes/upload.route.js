import express from "express";
import { protect } from "../middleware/auth.js";
import {
  uploadSingleImage,
  uploadMultipleImages,
  uploadBase64Image,
  deleteImageByPublicId,
  uploadAvatar,
  getUploadStats,
  uploadTaskAttachment,
  getFileInfo
} from "../controllers/upload.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Image uploads
router.post("/image", uploadSingleImage);
router.post("/images", uploadMultipleImages);
router.post("/base64", uploadBase64Image);

// Avatar upload
router.post("/avatar", uploadAvatar);

// Task attachments
router.post("/attachment", uploadTaskAttachment);

// File management
router.delete("/delete/:publicId", deleteImageByPublicId);
router.get("/info/:publicId", getFileInfo);

// Upload statistics
router.get("/stats", getUploadStats);

export default router;
