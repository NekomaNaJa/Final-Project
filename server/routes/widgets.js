import express from "express";
import protect from "../middleware/protect.js";
import { getMyWidget, updateMyWidget } from "../controllers/widgetController.js";

const router = express.Router();

router.get("/me", protect, getMyWidget);
router.put("/me", protect, updateMyWidget);

export default router;
