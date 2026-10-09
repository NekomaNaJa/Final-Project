import express from "express";
import { getPublicStreamer } from "../controllers/publicController.js";

const router = express.Router();

router.get("/:username", getPublicStreamer);

export default router;

