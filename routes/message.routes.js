import express from "express";
import {
  sendTextMessage,
  getMessages,
  clearMessages,
  getStatus,
  resetWhatsAppSession,
  getGroups,
} from "../controllers/message.controller.js";

const router = express.Router();

// Send text message
router.post("/send", sendTextMessage);

// Get received messages
router.get("/received", getMessages);

// Clear received messages
router.delete("/received", clearMessages);

// Get WhatsApp connection status
router.get("/status", getStatus);

// Reset WhatsApp session (for banned/error phones)
router.post("/reset-session", resetWhatsAppSession);

// Get all WhatsApp groups
router.get("/groups", getGroups);

export default router;
