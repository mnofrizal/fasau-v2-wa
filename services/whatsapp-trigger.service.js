import logger from "../config/logger.js";
import { sendMessage } from "./whatsapp-message.service.js";
import triggerConfigList from "../config/triggerList.config.js";
import triggerHandlerList from "../utils/triggerHandlerList.js";

// Global enabled state (separate from hardcoded config)
let globalEnabled = true; // Default enabled when server starts

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
    triggers: triggerConfigList.triggers,
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

    // Process text messages and media messages with captions
    const supportedTypes = [
      "text",
      "extended_text",
      "image",
      "video",
      "document",
    ];
    if (!supportedTypes.includes(messageData.type)) {
      return null;
    }

    // For media messages, check if there's a caption with trigger
    if (["image", "video", "document"].includes(messageData.type)) {
      // Media messages might not have captions or might have empty captions
      if (!messageData.message || messageData.message.startsWith("[")) {
        return null; // Skip media without captions or with default placeholders like "[Image]"
      }
    }

    const messageText = messageData.message.trim();

    // Find matching trigger
    const matchingTrigger = triggerConfigList.triggers.find((trigger) => {
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
      // Extract sender information from message data (now includes senderName and media type)
      const senderInfo = {
        phoneNumber: messageData.senderPhone,
        name: messageData.senderName || "Unknown User",
        jid: originalMessageKey.remoteJid,
        messageType: messageData.type, // Include media type information
      };

      logger.debug("Extracted sender info:", {
        senderName: messageData.senderName,
        phoneNumber: senderInfo.phoneNumber,
        finalName: senderInfo.name,
      });

      // Call the appropriate handler function
      if (triggerHandlerList[matchingTrigger.handler]) {
        // Check if handler is async (for .a1 report with image processing)
        const handlerResult = triggerHandlerList[matchingTrigger.handler](
          messageText,
          senderInfo,
          originalMessage,
          sock,
          originalMessageKey
        );

        // Handle both sync and async handlers
        if (handlerResult instanceof Promise) {
          responseText = await handlerResult;
        } else {
          responseText = handlerResult;
        }
      } else {
        responseText = "Handler function not found";
      }
    } else {
      // Use simple response for regular triggers
      responseText = matchingTrigger.response;
    }

    let response = null;

    // Check if reply is enabled for this trigger
    if (matchingTrigger.reply !== false) {
      // Default to true if not specified
      // Send reply to the original message
      response = await sendReplyMessage(
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
    } else {
      logger.info(
        `🔇 Trigger processed silently (reply disabled): ${matchingTrigger.prefix} from ${messageData.senderPhone}`
      );
    }

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
