import express from "express";
import { createDonation } from "../controllers/donationController.js";

const router = express.Router();

// Public: Donor สร้างรายการโดเนท
router.post("/", createDonation);

export default router;
