import logger from "../config/logger.js";
import config from "../config/config.js";
import {
  sendHumanLikeMessage,
  simulateReadMessage,
} from "../utils/humanBehavior.js";
import { processTriggers } from "./whatsapp-trigger.service.js";

// Message storage
let receivedMessages = [];

// Extract message content with better handling
const extractMessageContent = (message) => {
  let messageText = "";
  let messageType = "unknown";

  if (message.message.conversation) {
    messageText = message.message.conversation;
    messageType = "text";
  } else if (message.message.extendedTextMessage?.text) {
    messageText = message.message.extendedTextMessage.text;
    messageType = "extended_text";
  } else if (message.message.imageMessage) {
    messageText = message.message.imageMessage.caption || "[Image]";
    messageType = "image";
  } else if (message.message.videoMessage) {
    messageText = message.message.videoMessage.caption || "[Video]";
    messageType = "video";
  } else if (message.message.audioMessage) {
    messageText = "[Audio]";
    messageType = "audio";
  } else if (message.message.documentMessage) {
    messageText = `[Document: ${
      message.message.documentMessage.fileName || "Unknown"
    }]`;
    messageType = "document";
  } else if (message.message.stickerMessage) {
    messageText = "[Sticker]";
    messageType = "sticker";
  } else if (message.message.locationMessage) {
    messageText = "[Location]";
    messageType = "location";
  } else if (message.message.contactMessage) {
    messageText = `[Contact: ${
      message.message.contactMessage.displayName || "Unknown"
    }]`;
    messageType = "contact";
  } else {
    messageText = "[Unknown Media]";
    messageType = "media";
  }

  return { messageText, messageType };
};

// Extract sender information
const extractSenderInfo = (messageKey, message) => {
  const senderJid = messageKey.remoteJid;
  const isGroup = senderJid.includes("@g.us");
  const senderPhone = senderJid.split("@")[0];

  // Extract sender name from message
  const senderName =
    message?.pushName || message?.verifiedBizName || "Unknown User";

  return { senderJid, isGroup, senderPhone, senderName };
};

// Process incoming message
const processIncomingMessage = async (sock, message) => {
  try {
    if (!message.key.fromMe && message.message) {
      // Check message age - ignore messages older than configured threshold
      const messageTimestamp = message.messageTimestamp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const messageAge = currentTime - messageTimestamp;
      const thresholdMs = config.whatsapp.messageAgeThreshold * 1000; // Convert seconds to milliseconds

      if (messageAge > thresholdMs) {
        logger.debug(
          `⏰ Ignoring old message (${Math.round(messageAge / 1000)}s old)`,
          {
            messageId: message.key.id,
            messageAge: `${Math.round(messageAge / 1000)}s`,
            threshold: `${config.whatsapp.messageAgeThreshold}s`,
            sender: message.key.remoteJid?.split("@")[0],
          }
        );
        return null; // Skip processing old messages
      }

      // Extract sender information (including name)
      const { senderJid, isGroup, senderPhone, senderName } = extractSenderInfo(
        message.key,
        message
      );

      // Extract message content
      const { messageText, messageType } = extractMessageContent(message);

      const messageData = {
        id: message.key.id,
        from: senderJid,
        senderPhone: senderPhone,
        senderName: senderName,
        isGroup: isGroup,
        timestamp: message.messageTimestamp,
        message: messageText,
        type: messageType,
        receivedAt: new Date().toISOString(),
      };

      // Store message
      receivedMessages.push(messageData);

      // Enhanced logging with more context
      const logContext = {
        messageId: messageData.id,
        sender: isGroup ? `Group: ${senderPhone}` : `Contact: ${senderPhone}`,
        type: messageType,
        length: messageText.length,
        timestamp: new Date(messageData.timestamp * 1000).toLocaleString(
          "id-ID",
          {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        ),
      };

      logger.info(`📨 Message received from ${logContext.sender}`, {
        ...logContext,
        preview:
          messageText.length > 50
            ? messageText.substring(0, 50) + "..."
            : messageText,
      });

      // Log full message content separately for debugging (if needed)
      logger.debug(`📝 Full message content:`, {
        messageId: messageData.id,
        fullText: messageText,
        rawMessage: message.message,
      });

      // Simulate human-like reading behavior
      await simulateReadMessage(sock, message.key);

      // Process triggers for auto-response
      try {
        const triggerResult = await processTriggers(
          sock,
          messageData,
          message.key,
          message
        );
        if (triggerResult && triggerResult.triggered) {
          const responsePreview =
            triggerResult.response?.message?.substring(0, 50) ||
            "Report generated";
          logger.info(`🎯 Trigger executed: ${triggerResult.trigger.prefix}`);
        }
      } catch (triggerError) {
        logger.error("❌ Error processing triggers:", triggerError);
        // Don't throw error, continue with normal message processing
      }

      // Keep only last 100 messages to prevent memory issues
      if (receivedMessages.length > 100) {
        receivedMessages = receivedMessages.slice(-100);
      }

      return messageData;
    }
  } catch (error) {
    if (error.name === "PreKeyError") {
      logger.warn(
        `🔑 PreKey error for message ${message.key.id}, attempting to handle...`
      );
      // Try to refresh pre-keys
      try {
        await sock.sendPresenceUpdate("available");
        logger.debug("🔄 Refreshed presence to handle PreKey error");
      } catch (refreshError) {
        logger.warn("⚠️ Could not refresh presence for PreKey error");
      }
    } else {
      logger.error("❌ Error processing message:", {
        error: error.message,
        messageId: message.key?.id,
        sender: message.key?.remoteJid,
      });
    }
    throw error;
  }
};

// Handle messages upsert event
const handleMessagesUpsert = async (sock, m) => {
  const messages = m.messages;
  const processedMessages = [];

  for (const message of messages) {
    try {
      // Handle PreKey errors for encrypted messages
      if (m.type === "notify" && message.messageStubType === "CIPHERTEXT") {
        logger.debug("🔐 Received encrypted message, processing...");
      }

      const processedMessage = await processIncomingMessage(sock, message);
      if (processedMessage) {
        processedMessages.push(processedMessage);
      }
    } catch (error) {
      logger.error("❌ Error in message processing:", error);
    }
  }

  return processedMessages;
};

// Send message with human-like behavior
const sendMessage = async (sock, to, message) => {
  try {
    if (!sock) {
      throw new Error("WhatsApp socket is not available");
    }

    // Format phone number (add @s.whatsapp.net if not present)
    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

    // Use human-like behavior for sending message
    logger.info(`📤 Sending message with human-like behavior to: ${to}`);
    const result = await sendHumanLikeMessage(sock, jid, message);

    logger.info("✅ Message sent successfully to:", to);
    return {
      success: true,
      messageId: result.key.id,
      to: jid,
      message: message,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("❌ Error sending message:", error);
    throw error;
  }
};

// Get received messages
const getReceivedMessages = (limit = 50) => {
  return receivedMessages.slice(-limit).reverse();
};

// Clear received messages
const clearReceivedMessages = () => {
  receivedMessages = [];
  logger.info("🧹 Received messages cleared");
  return { success: true, message: "Messages cleared" };
};

// Get message statistics
const getMessageStats = () => {
  const stats = {
    totalMessages: receivedMessages.length,
    messageTypes: {},
    groupMessages: 0,
    directMessages: 0,
    lastMessageTime: null,
  };

  receivedMessages.forEach((msg) => {
    // Count by type
    stats.messageTypes[msg.type] = (stats.messageTypes[msg.type] || 0) + 1;

    // Count by source
    if (msg.isGroup) {
      stats.groupMessages++;
    } else {
      stats.directMessages++;
    }

    // Track last message time
    if (!stats.lastMessageTime || msg.timestamp > stats.lastMessageTime) {
      stats.lastMessageTime = msg.timestamp;
    }
  });

  return stats;
};

// Search messages
const searchMessages = (query, options = {}) => {
  const {
    limit = 50,
    messageType = null,
    isGroup = null,
    fromSender = null,
    dateFrom = null,
    dateTo = null,
  } = options;

  let filteredMessages = receivedMessages.filter((msg) => {
    // Text search
    if (query && !msg.message.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    // Type filter
    if (messageType && msg.type !== messageType) {
      return false;
    }

    // Group filter
    if (isGroup !== null && msg.isGroup !== isGroup) {
      return false;
    }

    // Sender filter
    if (fromSender && !msg.senderPhone.includes(fromSender)) {
      return false;
    }

    // Date filters
    if (dateFrom && msg.timestamp < dateFrom) {
      return false;
    }

    if (dateTo && msg.timestamp > dateTo) {
      return false;
    }

    return true;
  });

  return filteredMessages.slice(-limit).reverse();
};

export {
  handleMessagesUpsert,
  sendMessage,
  getReceivedMessages,
  clearReceivedMessages,
  getMessageStats,
  searchMessages,
  processIncomingMessage,
  extractMessageContent,
  extractSenderInfo,
};
