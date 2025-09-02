import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import config from "../config/config.js";
import logger from "../config/logger.js";

// Connection state
let sock = null;
let isConnected = false;
let isConnecting = false;
let qrCodeData = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 6; // 6 attempts * 20 seconds = 2 minutes
let reconnectTimeout = null;

// Event handlers registry
const eventHandlers = {
  onConnectionUpdate: [],
  onCredentialsUpdate: [],
  onMessagesUpsert: [],
  onMessageReceiptUpdate: [],
  onCallEvent: [],
  onIqError: [],
  onStreamError: [],
};

// Register event handler
const registerEventHandler = (event, handler) => {
  if (eventHandlers[event]) {
    eventHandlers[event].push(handler);
  }
};

// Clear all event handlers
const clearEventHandlers = () => {
  Object.keys(eventHandlers).forEach((event) => {
    eventHandlers[event] = [];
  });
  logger.debug("🧹 Cleared all event handlers");
};

// Emit event to all registered handlers
const emitEvent = (event, data) => {
  if (eventHandlers[event]) {
    eventHandlers[event].forEach((handler) => handler(data));
  }
};

// Create WhatsApp socket with configuration
const createSocket = async (authState) => {
  try {
    // Prevent multiple simultaneous connections
    if (isConnecting) {
      logger.warn("⚠️ Connection already in progress, skipping...");
      return sock;
    }

    isConnecting = true;

    // Clean up existing socket if it exists
    if (sock) {
      try {
        logger.debug("🧹 Cleaning up existing socket...");
        sock.ev.removeAllListeners();
        sock.end();
      } catch (cleanupError) {
        logger.warn("⚠️ Error cleaning up old socket:", cleanupError.message);
      }
      sock = null;
    }

    // Get latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(
      `📦 Using Baileys version: ${version.join(".")}, Latest: ${isLatest}`
    );

    sock = makeWASocket({
      version,
      auth: authState,
      markOnlineOnConnect: config.whatsapp.markOnlineOnConnect,
      syncFullHistory: config.whatsapp.syncFullHistory,
      defaultQueryTimeoutMs: 60000,
      generateHighQualityLinkPreview: true,
      logger: {
        level: "silent",
        trace: () => {},
        debug: () => {},
        info: (msg, extra) => {
          const message = typeof msg === "string" ? msg : JSON.stringify(msg);
          if (message.includes("connected to WA")) {
            logger.info("🔗 Connected to WhatsApp servers");
          } else if (message.includes("logging in")) {
            logger.info("🔐 Authenticating with WhatsApp...");
          } else if (message.includes("opened connection")) {
            logger.info("🌐 WhatsApp connection established");
          } else if (message.includes("pre-keys")) {
            logger.debug(`🔑 ${message}`);
          }
        },
        warn: (msg) => {
          const message = typeof msg === "string" ? msg : JSON.stringify(msg);
          logger.warn(`⚠️ ${message}`);
        },
        error: (msg) => {
          const message = typeof msg === "string" ? msg : JSON.stringify(msg);
          // Don't log PreKeyError as error, handle it separately
          if (!message.includes("PreKeyError")) {
            logger.error(`❌ ${message}`);
          }
        },
        fatal: (msg) => {
          const message = typeof msg === "string" ? msg : JSON.stringify(msg);
          logger.error(`💀 ${message}`);
        },
        child: () => ({
          level: "silent",
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
        }),
      },
    });

    setupEventListeners();
    return sock;
  } catch (error) {
    logger.error("❌ Error creating WhatsApp socket:", error);
    isConnecting = false;
    throw error;
  }
};

// Setup all event listeners
const setupEventListeners = () => {
  // Handle connection updates
  sock.ev.on("connection.update", handleConnectionUpdate);

  // Credentials update will be handled directly in main service

  // Handle authentication events
  sock.ev.on("connection.update", (update) => {
    if (update.isNewLogin) {
      logger.info("🔐 New login detected - session will be saved");
    }
    if (update.qr) {
      logger.info("📱 Please scan the QR code above to authenticate");
    }
  });

  // Handle incoming messages
  sock.ev.on("messages.upsert", (m) => {
    emitEvent("onMessagesUpsert", m);
  });

  // Handle message receipt updates
  sock.ev.on("message-receipt.update", (update) => {
    logger.debug(`📧 Message receipt update: ${update.length} receipts`);
    emitEvent("onMessageReceiptUpdate", update);
  });

  // Handle call events
  sock.ev.on("CB:call", (data) => {
    logger.debug("📞 Call event received");
    emitEvent("onCallEvent", data);
  });

  // Handle socket errors
  sock.ev.on("CB:iq-error", (error) => {
    if (error.attrs?.type === "error") {
      logger.debug("🔧 IQ Error handled silently");
    }
    emitEvent("onIqError", error);
  });

  // Handle connection errors
  sock.ev.on("CB:stream:error", (error) => {
    logger.warn("🌊 Stream error:", error);
    emitEvent("onStreamError", error);
  });
};

// Handle connection updates
const handleConnectionUpdate = (update) => {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    logger.info("📱 QR Code generated! Please scan with your WhatsApp:");
    qrcode.generate(qr, { small: true });
    qrCodeData = qr;
  }

  if (connection === "connecting") {
    logger.info("🔗 Connecting to WhatsApp...");
  } else if (connection === "close") {
    isConnecting = false;
    handleConnectionClose(lastDisconnect);
  } else if (connection === "open") {
    isConnecting = false;
    handleConnectionOpen();
  }

  emitEvent("onConnectionUpdate", update);
};

// Handle connection close
const handleConnectionClose = (lastDisconnect) => {
  const shouldReconnect =
    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
  const reason = lastDisconnect?.error?.output?.statusCode;

  let reasonText = "Unknown";
  let shouldResetSession = false;

  switch (reason) {
    case DisconnectReason.badSession:
      reasonText = "Bad Session File";
      shouldResetSession = true;
      break;
    case DisconnectReason.connectionClosed:
      reasonText = "Connection Closed";
      break;
    case DisconnectReason.connectionLost:
      reasonText = "Connection Lost";
      break;
    case DisconnectReason.connectionReplaced:
      reasonText = "Connection Replaced";
      shouldResetSession = true;
      break;
    case DisconnectReason.loggedOut:
      reasonText = "Logged Out";
      shouldResetSession = true;
      break;
    case DisconnectReason.restartRequired:
      reasonText = "Restart Required";
      break;
    case DisconnectReason.timedOut:
      reasonText = "Connection Timed Out";
      break;
  }

  logger.warn(`❌ WhatsApp connection closed: ${reasonText}`, {
    reconnecting: shouldReconnect,
    attempt: reconnectAttempts + 1,
    maxAttempts: maxReconnectAttempts,
  });

  isConnected = false;

  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (shouldReconnect) {
    handleReconnection(shouldResetSession, reasonText);
  } else {
    // Reset attempts if we're not reconnecting
    reconnectAttempts = 0;
  }
};

// Handle reconnection logic
const handleReconnection = (shouldResetSession, reasonText) => {
  reconnectAttempts++;

  // If we should reset session immediately (bad session, logged out, etc.)
  if (shouldResetSession) {
    logger.warn(
      `🔄 Session issue detected (${reasonText}), resetting session immediately...`
    );
    reconnectAttempts = 0; // Reset counter since we're doing a fresh start
    emitEvent("onConnectionUpdate", { shouldResetSession: true });
    return;
  }

  // If we've exceeded max reconnect attempts, reset session
  if (reconnectAttempts >= maxReconnectAttempts) {
    logger.error(
      `❌ Max reconnection attempts (${maxReconnectAttempts}) reached after 2 minutes`
    );
    logger.warn(
      "🔄 Phone may be banned or having persistent issues, resetting session..."
    );
    emitEvent("onConnectionUpdate", { shouldResetSession: true });
    return;
  }

  // Normal reconnection attempt
  const delay = Math.min(3000 + reconnectAttempts * 2000, 20000); // Exponential backoff, max 20s
  logger.info(
    `🔄 Reconnecting in ${
      delay / 1000
    } seconds... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`
  );

  reconnectTimeout = setTimeout(() => {
    emitEvent("onConnectionUpdate", { shouldReconnect: true });
  }, delay);
};

// Handle successful connection
const handleConnectionOpen = () => {
  logger.info("✅ WhatsApp connected successfully!");
  logger.info("🎯 Ready to send and receive messages");

  // Reset reconnection attempts on successful connection
  reconnectAttempts = 0;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  isConnected = true;
  qrCodeData = null;
};

// Get connection status
const getConnectionStatus = () => {
  return {
    isConnected,
    isConnecting,
    hasQR: !!qrCodeData,
    qrCode: qrCodeData,
  };
};

// Get socket instance
const getSocket = () => sock;

// Reset connection state
const resetConnectionState = () => {
  isConnected = false;
  isConnecting = false;
  qrCodeData = null;
  reconnectAttempts = 0;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Clean up socket if it exists
  if (sock) {
    try {
      logger.debug("🧹 Cleaning up socket in resetConnectionState...");
      sock.ev.removeAllListeners();
      sock.end();
    } catch (cleanupError) {
      logger.warn(
        "⚠️ Error cleaning up socket in reset:",
        cleanupError.message
      );
    }
    sock = null;
  }
};

export {
  createSocket,
  getConnectionStatus,
  getSocket,
  resetConnectionState,
  registerEventHandler,
  clearEventHandlers,
  emitEvent,
};
