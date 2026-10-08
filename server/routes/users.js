import express from "express";
import protect from "../middleware/protect.js";
import {
  getMe,
  updateMe,
  updatePayment,
  updateDonationPage,
  changePassword,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/payment", protect, updatePayment);
router.put("/donation-page", protect, updateDonationPage);
router.put("/change-password", protect, changePassword);

export default router;
