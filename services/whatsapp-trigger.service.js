import logger from "../config/logger.js";
import { sendMessage } from "./whatsapp-message.service.js";

// Hardcoded trigger configuration
const triggerConfig = {
  globalEnabled: true, // Default enabled
  triggers: [
    {
      prefix: ".a1",
      type: "function", // Special function-based trigger
      handler: "handleA1Report",
      enabled: true,
    },
    {
      prefix: ".help",
      response:
        "📋 AVAILABLE COMMANDS:\n\n.a1 <pesan> - Buat laporan dengan format khusus\n  Contoh: .a1 laporan ada kerusakan plafond\n\n.help - Show this help\n.ping - Pong! 🏓",
      enabled: true,
    },
    {
      prefix: ".ping",
      response: "Pong! 🏓",
      enabled: true,
    },
  ],
};

// Global enabled state (separate from hardcoded config)
let globalEnabled = true; // Default enabled when server starts

// Helper function to format timestamp in Indonesian locale
const formatTimestamp = () => {
  const now = new Date();
  const options = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  return now.toLocaleString("id-ID", options);
};

// Handler for .a1 reports
const handleA1Report = (messageText, senderInfo) => {
  // Remove the .a1 prefix and trim
  const reportContent = messageText.replace(/^\.a1\s*/, "").trim();

  // If no content after .a1, show usage
  if (!reportContent) {
    return "Format: .a1 <pesan laporan>\nContoh: .a1 laporan ada kerusakan plafond";
  }

  // Create formatted report response
  const response = `📋 LAPORAN DITERIMA
    
Pelapor: ${senderInfo.name || "Unknown"}
Nomor HP: ${senderInfo.phoneNumber}
Waktu: ${formatTimestamp()}
Pesan: ${reportContent}

Status: ✅ Laporan telah diterima dan akan diproses`;

  return response;
};

// Check if triggers are enabled globally
const isTriggersEnabled = () => {
  return globalEnabled;
};

// Enable or disable triggers globally
const setTriggersEnabled = (enabled) => {
  globalEnabled = enabled;
  logger.info(`🔧 Triggers ${enabled ? "enabled" : "disabled"} globally`);
  return {
    success: true,
    enabled: globalEnabled,
    message: `Triggers ${enabled ? "enabled" : "disabled"} successfully`,
  };
};

// Get all triggers (read-only)
const getTriggers = () => {
  return {
    enabled: globalEnabled,
    triggers: triggerConfig.triggers,
  };
};

// Process message for triggers
const processTriggers = async (
  sock,
  messageData,
  originalMessageKey,
  originalMessage
) => {
  try {
    // Check if triggers are globally enabled
    if (!globalEnabled) {
      return null;
    }

    // Only process text messages
    if (messageData.type !== "text" && messageData.type !== "extended_text") {
      return null;
    }

    const messageText = messageData.message.trim();

    // Find matching trigger
    const matchingTrigger = triggerConfig.triggers.find((trigger) => {
      return (
        trigger.enabled &&
        messageText.toLowerCase().startsWith(trigger.prefix.toLowerCase())
      );
    });

    if (!matchingTrigger) {
      return null;
    }

    logger.info(
      `🎯 Trigger matched: ${matchingTrigger.prefix} from ${messageData.senderPhone}`
    );

    let responseText;

    // Handle function-based triggers
    if (matchingTrigger.type === "function" && matchingTrigger.handler) {
      // Extract sender information from WhatsApp message data
      // The pushName is available directly from the original message
      const displayName =
        originalMessage?.pushName ||
        originalMessage?.verifiedBizName ||
        "Unknown User";

      const senderInfo = {
        phoneNumber: messageData.senderPhone,
        name: displayName,
        jid: originalMessageKey.remoteJid,
      };

      logger.debug("Extracted sender info:", {
        pushName: originalMessage?.pushName,
        verifiedBizName: originalMessage?.verifiedBizName,
        finalName: displayName,
        phoneNumber: senderInfo.phoneNumber,
      });

      // Call the appropriate handler function
      if (matchingTrigger.handler === "handleA1Report") {
        responseText = handleA1Report(messageText, senderInfo);
      } else {
        responseText = "Handler function not found";
      }
    } else {
      // Use simple response for regular triggers
      responseText = matchingTrigger.response;
    }

    // Send reply to the original message
    const response = await sendReplyMessage(
      sock,
      originalMessageKey,
      responseText,
      originalMessage
    );

    logger.info(
      `🤖 Auto-reply sent: "${responseText.substring(0, 50)}..." to ${
        messageData.senderPhone
      }`
    );

    return {
      triggered: true,
      trigger: matchingTrigger,
      response: response,
      originalMessage: messageData,
    };
  } catch (error) {
    logger.error("❌ Error processing triggers:", {
      error: error.message,
      messageId: messageData.id,
      sender: messageData.senderPhone,
    });
    throw error;
  }
};

// Send reply message with human-like behavior
const sendReplyMessage = async (
  sock,
  messageKey,
  replyText,
  originalMessage
) => {
  try {
    if (!sock) {
      throw new Error("WhatsApp socket is not available");
    }

    logger.info(
      `📤 Sending reply with human-like behavior to ${messageKey.remoteJid}`
    );

    // Import human behavior functions
    const { sendHumanLikeMessage } = await import("../utils/humanBehavior.js");

    logger.debug("🔍 Original message for quote:", {
      messageKey: messageKey,
      originalMessage: originalMessage,
    });

    // Send reply message with the original message as quoted
    const result = await sendHumanLikeMessage(
      sock,
      messageKey.remoteJid,
      replyText,
      {
        quoted: originalMessage, // Pass the full original message object
      }
    );

    logger.info("✅ Reply sent successfully");
    return {
      success: true,
      messageId: result.key.id,
      to: messageKey.remoteJid,
      message: replyText,
      timestamp: new Date().toISOString(),
      isReply: true,
    };
  } catch (error) {
    logger.error("❌ Error sending reply:", error);
    throw error;
  }
};

export {
  // Configuration functions
  isTriggersEnabled,
  setTriggersEnabled,
  getTriggers,

  // Processing function
  processTriggers,
};
