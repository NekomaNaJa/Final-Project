import express from "express";
import protect from "../middleware/protect.js";
import { getMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getMe);

export default router;
