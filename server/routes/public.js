import express from "express";
import {
  getPublicStreamer,
  getTtsAudio,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/tts", getTtsAudio);
router.get("/:username", getPublicStreamer);

export default router;
