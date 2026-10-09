import express from "express";
import {
  getPublicStreamer,
  getPublicOverlayConfig,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/overlay/:widgetType/:token", getPublicOverlayConfig);
router.get("/:username", getPublicStreamer);

export default router;

