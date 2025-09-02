import logger from "../config/logger.js";
import {
  createSocket,
  getConnectionStatus,
  getSocket,
  resetConnectionState,
  registerEventHandler,
} from "./whatsapp-connection.service.js";
import {
  getAuthState,
  resetSession,
  sessionExists,
  getSessionInfo,
  cleanupOldSessions,
  backupSession,
} from "./whatsapp-session.service.js";
import {
  handleMessagesUpsert,
  sendMessage as sendMessageService,
  sendReaction as sendReactionService,
  getReceivedMessages,
  clearReceivedMessages,
  getMessageStats,
  searchMessages,
} from "./whatsapp-message.service.js";
import { getGroupList, sendGroupMessage } from "./whatsapp-group.service.js";

// Main WhatsApp service state
let isInitialized = false;

// Initialize WhatsApp connection and services
const initializeWhatsApp = async () => {
  try {
    if (isInitialized) {
      logger.warn("⚠️ WhatsApp service is already initialized");
      return;
    }

    logger.info("🚀 Starting WhatsApp service...");

    // Register event handlers
    setupEventHandlers();

    // Start connection
    await connectToWhatsApp();

    isInitialized = true;
    logger.info("✅ WhatsApp service initialized successfully");
  } catch (error) {
    logger.error("❌ Error initializing WhatsApp service:", error);
    throw error;
  }
};

// Setup event handlers for all services
const setupEventHandlers = () => {
  // Handle connection updates
  registerEventHandler("onConnectionUpdate", async (update) => {
    if (update.shouldResetSession) {
      await handleSessionReset();
    } else if (update.shouldReconnect) {
      await connectToWhatsApp();
    }
  });

  // Handle credentials update - will be set up during connection

  // Handle incoming messages
  registerEventHandler("onMessagesUpsert", async (m) => {
    const sock = getSocket();
    if (sock) {
      await handleMessagesUpsert(sock, m);
    }
  });

  // Handle message receipts
  registerEventHandler("onMessageReceiptUpdate", (update) => {
    logger.debug(`📧 Message receipt update: ${update.length} receipts`);
  });

  // Handle call events
  registerEventHandler("onCallEvent", (data) => {
    logger.debug("📞 Call event received");
  });

  // Handle IQ errors
  registerEventHandler("onIqError", (error) => {
    if (error.attrs?.type === "error") {
      logger.debug("🔧 IQ Error handled silently");
    }
  });

  // Handle stream errors
  registerEventHandler("onStreamError", (error) => {
    logger.warn("🌊 Stream error:", error);
  });
};

// Connect to WhatsApp
const connectToWhatsApp = async () => {
  try {
    logger.info("🔄 Initializing WhatsApp connection...");

    // Get authentication state
    const { state, saveCreds } = await getAuthState();

    // Create socket with auth state
    const socket = await createSocket(state);

    // Register credentials save handler directly on socket
    if (socket) {
      socket.ev.on("creds.update", saveCreds);
    }

    logger.info("🔗 WhatsApp connection process started");
  } catch (error) {
    logger.error("❌ Error connecting to WhatsApp:", error);

    // Retry connection after delay
    setTimeout(() => {
      connectToWhatsApp();
    }, 5000);
  }
};

// Handle session reset
const handleSessionReset = async () => {
  try {
    logger.warn("🔄 Handling session reset...");

    // Reset connection state
    resetConnectionState();

    // Reset session files
    await resetSession();

    // Wait a moment before reconnecting
    setTimeout(() => {
      connectToWhatsApp();
    }, 2000);
  } catch (error) {
    logger.error("❌ Error handling session reset:", error);

    // Try to reconnect anyway after a delay
    setTimeout(() => {
      connectToWhatsApp();
    }, 5000);
  }
};

// Send message wrapper
const sendMessage = async (to, message) => {
  try {
    const sock = getSocket();
    if (!sock) {
      throw new Error("WhatsApp is not connected");
    }

    return await sendMessageService(sock, to, message);
  } catch (error) {
    logger.error("❌ Error in sendMessage:", error);
    throw error;
  }
};

// Send reaction wrapper
const sendReaction = async (messageKey, emoji) => {
  try {
    const sock = getSocket();
    if (!sock) {
      throw new Error("WhatsApp is not connected");
    }

    return await sendReactionService(sock, messageKey, emoji);
  } catch (error) {
    logger.error("❌ Error in sendReaction:", error);
    throw error;
  }
};

// Get group list wrapper
const getGroups = async () => {
  try {
    const sock = getSocket();
    if (!sock) {
      throw new Error("WhatsApp is not connected");
    }

    return await getGroupList(sock);
  } catch (error) {
    logger.error("❌ Error in getGroups:", error);
    throw error;
  }
};

// Send group message wrapper
const sendToGroup = async (groupId, message) => {
  try {
    const sock = getSocket();
    if (!sock) {
      throw new Error("WhatsApp is not connected");
    }

    return await sendGroupMessage(sock, groupId, message);
  } catch (error) {
    logger.error("❌ Error in sendToGroup:", error);
    throw error;
  }
};

// Get service status
const getServiceStatus = () => {
  const connectionStatus = getConnectionStatus();
  const sessionInfo = getSessionInfo();
  const messageStats = getMessageStats();

  return {
    initialized: isInitialized,
    connection: connectionStatus,
    session: sessionInfo,
    messages: messageStats,
    services: {
      connection: "active",
      session: "active",
      message: "active",
      group: "active",
    },
  };
};

// Restart service
const restartService = async () => {
  try {
    logger.info("🔄 Restarting WhatsApp service...");

    // Reset states
    isInitialized = false;
    resetConnectionState();

    // Reinitialize
    await initializeWhatsApp();

    logger.info("✅ WhatsApp service restarted successfully");
    return { success: true, message: "Service restarted successfully" };
  } catch (error) {
    logger.error("❌ Error restarting service:", error);
    throw error;
  }
};

// Export all functions
export {
  // Core service functions
  initializeWhatsApp,
  getServiceStatus,
  restartService,

  // Connection functions
  getConnectionStatus,

  // Session functions
  resetSession,
  sessionExists,
  getSessionInfo,
  cleanupOldSessions,
  backupSession,

  // Message functions
  sendMessage,
  sendReaction,
  getReceivedMessages,
  clearReceivedMessages,
  getMessageStats,
  searchMessages,

  // Group functions - basic functionality only
  getGroups as getGroupList,
  sendToGroup as sendGroupMessage,
};
