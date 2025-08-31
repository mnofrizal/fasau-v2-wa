import {
  sendMessage,
  getConnectionStatus,
  getReceivedMessages,
  clearReceivedMessages,
  resetSession,
  getGroupList,
} from "../services/whatsapp.service.js";
import logger from "../config/logger.js";
import {
  sendSuccess,
  sendError,
  sendConnectionError,
  sendValidationError,
  asyncHandler,
} from "../utils/responseHandler.js";

const sendTextMessage = asyncHandler(async (req, res) => {
  const { to, message } = req.body;

  // Validate required fields
  if (!to || !message) {
    return sendValidationError(res, "Missing required fields: to and message");
  }

  // Check if WhatsApp is connected
  const status = getConnectionStatus();
  if (!status.isConnected) {
    return sendConnectionError(res, status.hasQR);
  }

  try {
    // Send message
    const result = await sendMessage(to, message);
    return sendSuccess(res, result, "Message sent successfully");
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to send message",
      500,
      "sendTextMessage"
    );
  }
});

const getMessages = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = getReceivedMessages(limit);

    const data = {
      messages,
      count: messages.length,
    };

    return sendSuccess(res, data, "Messages retrieved successfully");
  } catch (error) {
    return sendError(res, error, "Failed to get messages", 500, "getMessages");
  }
});

const clearMessages = asyncHandler(async (req, res) => {
  try {
    const result = clearReceivedMessages();
    return sendSuccess(res, result, "Messages cleared successfully");
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to clear messages",
      500,
      "clearMessages"
    );
  }
});

const getStatus = asyncHandler(async (req, res) => {
  try {
    const status = getConnectionStatus();
    return sendSuccess(res, status, "Status retrieved successfully");
  } catch (error) {
    return sendError(res, error, "Failed to get status", 500, "getStatus");
  }
});

const resetWhatsAppSession = asyncHandler(async (req, res) => {
  try {
    logger.info("🔄 Manual session reset requested");
    await resetSession();
    return sendSuccess(
      res,
      null,
      "WhatsApp session reset initiated. Please wait for reconnection."
    );
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to reset session",
      500,
      "resetWhatsAppSession"
    );
  }
});

const getGroups = asyncHandler(async (req, res) => {
  // Check if WhatsApp is connected
  const status = getConnectionStatus();
  if (!status.isConnected) {
    return sendConnectionError(res, status.hasQR);
  }

  try {
    // Get group list
    const result = await getGroupList();
    return sendSuccess(res, result, "Groups retrieved successfully");
  } catch (error) {
    return sendError(res, error, "Failed to get group list", 500, "getGroups");
  }
});

export {
  sendTextMessage,
  getMessages,
  clearMessages,
  getStatus,
  resetWhatsAppSession,
  getGroups,
};
