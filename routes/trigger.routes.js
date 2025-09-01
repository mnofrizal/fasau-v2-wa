import express from "express";
import {
  getTriggerConfig,
  setTriggerStatus,
} from "../controllers/trigger.controller.js";

const router = express.Router();

// Get trigger configuration and status (read-only)
router.get("/", getTriggerConfig);

// Enable/disable triggers globally
router.post("/status", setTriggerStatus);

export default router;
