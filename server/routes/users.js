import express from "express";
import protect from "../middleware/protect.js";
import { getMe, updateMe, updatePayment } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/payment", protect, updatePayment);

export default router;
