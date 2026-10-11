import express from "express";
import protect from "../middleware/protect.js";
import {
  getMe,
  updateMe,
  updatePayment,
  updateDonationPage,
  changePassword,
  sendLinkOtp,
  verifyLinkOtp,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/payment", protect, updatePayment);
router.put("/donation-page", protect, updateDonationPage);
router.put("/change-password", protect, changePassword);

// Email & Phone Linking OTP Flow
router.post("/link-otp/send", protect, sendLinkOtp);
router.post("/link-otp/verify", protect, verifyLinkOtp);

export default router;
