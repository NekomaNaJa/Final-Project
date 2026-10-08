import express from "express";
import {
  createDonation,
  getDonations,
  getDonationStats,
  updateDonationStatus,
} from "../controllers/donationController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Public: Donor สร้างรายการโดเนท
router.post("/", createDonation);

// Protected: สตรีมเมอร์เข้าถึงประวัติและสถิติ
router.get("/", protect, getDonations);
router.get("/stats", protect, getDonationStats);
router.patch("/:id", protect, updateDonationStatus);

export default router;
