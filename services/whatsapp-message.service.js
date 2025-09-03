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

  // Debug logging to see the actual structure
  logger.debug("🔍 Message Key Structure:", {
    remoteJid: messageKey.remoteJid,
    participant: messageKey.participant,
    participantPn: messageKey.participantPn,
    fromMe: messageKey.fromMe,
    id: messageKey.id,
    isGroup: isGroup,
    fullMessageKey: messageKey,
  });

  // Additional debug for message object
  logger.debug("🔍 Message Object Structure:", {
    pushName: message?.pushName,
    verifiedBizName: message?.verifiedBizName,
    participant: message?.participant,
    messageContextInfo: message?.messageContextInfo,
    hasQuotedMessage:
      !!message?.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    contextInfo: message?.message?.extendedTextMessage?.contextInfo,
    conversationMessage: message?.message?.conversation,
    extendedTextMessage: message?.message?.extendedTextMessage,
  });

  // For group messages, try multiple approaches to get the actual sender
  let senderPhone;
  let actualSenderJid;

  if (isGroup) {
    // Try different approaches to get the actual sender in group messages
    if (messageKey.participantPn) {
      // Method 1: From messageKey.participantPn (the correct field for phone numbers!)
      actualSenderJid = messageKey.participantPn;
      senderPhone = messageKey.participantPn.split("@")[0];
      logger.debug("📱 Group message - Method 1 (messageKey.participantPn):", {
        participantPn: messageKey.participantPn,
        extractedPhone: senderPhone,
      });
    } else if (messageKey.participant) {
      // Method 2: From messageKey.participant (fallback, might not be phone number)
      actualSenderJid = messageKey.participant;
      senderPhone = messageKey.participant.split("@")[0];
      logger.debug("📱 Group message - Method 2 (messageKey.participant):", {
        participant: messageKey.participant,
        extractedPhone: senderPhone,
      });
    } else if (message?.participant) {
      // Method 3: From message.participant
      actualSenderJid = message.participant;
      senderPhone = message.participant.split("@")[0];
      logger.debug("📱 Group message - Method 3 (message.participant):", {
        participant: message.participant,
        extractedPhone: senderPhone,
      });
    } else if (
      message?.message?.extendedTextMessage?.contextInfo?.participant
    ) {
      // Method 4: From contextInfo.participant
      actualSenderJid =
        message.message.extendedTextMessage.contextInfo.participant;
      senderPhone = actualSenderJid.split("@")[0];
      logger.debug("📱 Group message - Method 4 (contextInfo.participant):", {
        participant: actualSenderJid,
        extractedPhone: senderPhone,
      });
    } else {
      // Fallback: Use group ID (this is wrong but helps identify the issue)
      actualSenderJid = senderJid;
      senderPhone = senderJid.split("@")[0];
      logger.warn(
        "⚠️ Group message - No participant found, using group ID as fallback:",
        {
          remoteJid: messageKey.remoteJid,
          fallbackPhone: senderPhone,
          messageKey: messageKey,
          message: message,
        }
      );
    }
  } else {
    // Personal message: extract phone from remoteJid
    actualSenderJid = senderJid;
    senderPhone = senderJid.split("@")[0];
    logger.debug("📱 Personal message - extracted phone from remoteJid:", {
      remoteJid: messageKey.remoteJid,
      extractedPhone: senderPhone,
    });
  }

  // Extract sender name from message
  const senderName =
    message?.pushName || message?.verifiedBizName || "Unknown User";

  // Validate if the extracted phone looks like a real phone number
  const isValidPhone =
    senderPhone.match(/^62\d{9,13}$/) ||
    senderPhone.match(/^08\d{8,12}$/) ||
    senderPhone.match(/^\d{10,15}$/);

  logger.debug("👤 Final sender info:", {
    senderJid: actualSenderJid,
    isGroup,
    senderPhone,
    senderName,
    isValidPhone: !!isValidPhone,
    phoneLength: senderPhone.length,
  });

  return { senderJid: actualSenderJid, isGroup, senderPhone, senderName };
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
        logger.info(
          `⏰ OLD MESSAGE (${Math.round(
            messageAge / 1000
          )}s old) - Marking as read but skipping triggers - ID: ${
            message.key.id
          }`,
          {
            messageId: message.key.id,
            messageAge: `${Math.round(messageAge / 1000)}s`,
            threshold: `${config.whatsapp.messageAgeThreshold}s`,
            sender: message.key.remoteJid?.split("@")[0],
            timestamp: new Date(message.messageTimestamp * 1000).toLocaleString(
              "id-ID",
              { timeZone: "Asia/Jakarta" }
            ),
          }
        );

        // Still mark old messages as read, but don't process triggers
        try {
          await simulateReadMessage(sock, message.key);
          logger.debug(`👁️ Old message marked as read - ID: ${message.key.id}`);
        } catch (readError) {
          logger.warn(
            `⚠️ Failed to mark old message as read - ID: ${message.key.id}:`,
            readError.message
          );
        }

        return null; // Skip further processing (triggers, storage) for old messages
      }

      // Log that we're processing a recent message
      logger.info(
        `✅ PROCESSING RECENT MESSAGE (${Math.round(
          messageAge / 1000
        )}s old) - ID: ${message.key.id}`,
        {
          messageId: message.key.id,
          messageAge: `${Math.round(messageAge / 1000)}s`,
          threshold: `${config.whatsapp.messageAgeThreshold}s`,
          sender: message.key.remoteJid?.split("@")[0],
          timestamp: new Date(message.messageTimestamp * 1000).toLocaleString(
            "id-ID",
            { timeZone: "Asia/Jakarta" }
          ),
        }
      );

      // Only process recent messages below this point

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
        sender: isGroup
          ? `Group: ${senderJid.split("@")[0]} (from: ${senderPhone})`
          : `Contact: ${senderPhone}`,
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
        fullMessage: message, // Log the entire message object to see all available fields
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

      // Keep only last 10 messages to prevent memory issues
      if (receivedMessages.length > 10) {
        receivedMessages = receivedMessages.slice(-10);
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

  logger.info(
    `📥 BATCH: Processing ${messages.length} message(s) - Type: ${m.type}`
  );

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    try {
      logger.info(
        `📨 BATCH MESSAGE ${i + 1}/${messages.length} - ID: ${message.key.id}`
      );

      // Handle PreKey errors for encrypted messages
      if (m.type === "notify" && message.messageStubType === "CIPHERTEXT") {
        logger.debug("🔐 Received encrypted message, processing...");
      }

      const processedMessage = await processIncomingMessage(sock, message);
      if (processedMessage) {
        processedMessages.push(processedMessage);
        logger.info(
          `✅ BATCH MESSAGE ${i + 1} PROCESSED - ID: ${message.key.id}`
        );
      } else {
        logger.info(
          `⏭️ BATCH MESSAGE ${i + 1} SKIPPED (old message) - ID: ${
            message.key.id
          }`
        );
      }
    } catch (error) {
      logger.error(`❌ Error in batch message ${i + 1} processing:`, error);
    }
  }

  logger.info(
    `📤 BATCH COMPLETE: ${processedMessages.length}/${messages.length} messages processed`
  );
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

// Send reaction to a message
const sendReaction = async (sock, messageKey, emoji) => {
  try {
    if (!sock) {
      throw new Error("WhatsApp socket is not available");
    }

    // Validate emoji (optional - you can add more validation)
    if (!emoji || typeof emoji !== "string") {
      throw new Error("Valid emoji is required");
    }

    logger.info(`👍 Sending reaction "${emoji}" to message: ${messageKey.id}`);

    // Send reaction using Baileys
    const result = await sock.sendMessage(messageKey.remoteJid, {
      react: {
        text: emoji,
        key: messageKey,
      },
    });

    logger.info(`✅ Reaction sent successfully: ${emoji}`);
    return {
      success: true,
      messageId: result.key.id,
      reaction: emoji,
      targetMessage: messageKey.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("❌ Error sending reaction:", error);
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
  sendReaction,
  getReceivedMessages,
  clearReceivedMessages,
  getMessageStats,
  searchMessages,
  processIncomingMessage,
  extractMessageContent,
  extractSenderInfo,
};
