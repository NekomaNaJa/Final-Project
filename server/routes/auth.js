import express from "express";
import {
  register,
  login,
  googleAuth,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
} from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);

// Forgot Password Flow
router.post("/forgot-password/send-otp", authLimiter, forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", authLimiter, forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", authLimiter, forgotPasswordReset);

export default router;
