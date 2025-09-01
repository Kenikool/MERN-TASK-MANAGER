import express from "express"
import { login, register, getMe, updateProfile, logout, changePassword, refreshToken } from "../controllers/auth.controller.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()
router.post("/register", register)
router.post("/login", login)
router.get("/me",protect, getMe)
router.put("/profile",protect, updateProfile)
router.put("/change-password",protect, changePassword)
router.post("/logout",protect, logout)
router.post("/refresh",protect, refreshToken)

export default router