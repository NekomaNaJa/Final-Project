import express from "express";
import protect from "../middleware/protect.js";
import {
  getDonations,
  getDonationStats,
  updateDonationStatus,
} from "../controllers/donationController.js";

const router = express.Router();

router.get("/", protect, getDonations);
router.get("/stats", protect, getDonationStats);
router.patch("/:id", protect, updateDonationStatus);

export default router;
