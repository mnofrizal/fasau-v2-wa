import logger from "../config/logger.js";
import { sleep, getHumanTimings } from "./timing.js";

// Send read receipt (seen)
const sendSeen = async (sock, jid) => {
  try {
    await sock.readMessages([
      { remoteJid: jid, id: "dummy", participant: undefined },
    ]);
    logger.debug(`👁️ Sent seen indicator to ${jid}`);
  } catch (error) {
    logger.warn(`⚠️ Could not send seen indicator: ${error.message}`);
  }
};

// Send typing indicator
const sendTyping = async (sock, jid, duration = 3000) => {
  try {
    await sock.sendPresenceUpdate("composing", jid);
    logger.debug(`⌨️ Started typing indicator for ${jid} (${duration}ms)`);

    // Keep typing for the specified duration
    await sleep(duration);

    // Stop typing
    await sock.sendPresenceUpdate("paused", jid);
    logger.debug(`⏸️ Stopped typing indicator for ${jid}`);
  } catch (error) {
    logger.warn(`⚠️ Could not send typing indicator: ${error.message}`);
  }
};

// Send online presence
const sendOnlinePresence = async (sock) => {
  try {
    await sock.sendPresenceUpdate("available");
    logger.debug("🟢 Set presence to online");
  } catch (error) {
    logger.warn(`⚠️ Could not update online presence: ${error.message}`);
  }
};

// Human-like message sending sequence
const sendHumanLikeMessage = async (sock, jid, message, options = {}) => {
  try {
    const isReply = options.quoted ? true : false;
    logger.info(
      `🤖 Starting human-like ${
        isReply ? "reply" : "message"
      } sequence to ${jid}`
    );

    // Get human-like timings
    const timings = getHumanTimings(message);
    logger.debug(
      `⏱️ Timings: seen=${timings.seenDelay}ms, typing=${timings.typingDelay}ms, send=${timings.sendDelay}ms`
    );

    // Step 1: Set online presence
    await sendOnlinePresence(sock);

    // Step 2: Wait a bit, then send seen
    await sleep(timings.seenDelay);
    await sendSeen(sock, jid);

    // Step 3: Wait a bit more, then start typing
    await sleep(500 + Math.random() * 1000); // Random delay between seen and typing
    await sendTyping(sock, jid, timings.typingDelay);

    // Step 4: Small delay before sending message
    await sleep(timings.sendDelay);

    // Step 5: Send the actual message (with quote if it's a reply)
    let result;
    if (options.quoted) {
      // Send as reply message using Baileys' reply method
      logger.debug("📝 Sending quoted reply message");
      result = await sock.sendMessage(
        jid,
        { text: message },
        { quoted: options.quoted }
      );
    } else {
      // Send as regular message
      result = await sock.sendMessage(jid, { text: message });
    }

    // Step 6: Set presence back to available
    await sleep(200);
    await sendOnlinePresence(sock);

    logger.info(
      `✅ Human-like ${
        isReply ? "reply" : "message"
      } sent successfully to ${jid}`
    );
    return result;
  } catch (error) {
    logger.error(`❌ Error in human-like message sequence: ${error.message}`);
    throw error;
  }
};

// Simulate reading a message (for incoming messages)
const simulateReadMessage = async (sock, messageKey) => {
  try {
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds delay
    await sleep(delay);

    await sock.readMessages([messageKey]);
    logger.debug(`👁️ Marked message as read after ${delay}ms delay`);
  } catch (error) {
    logger.warn(`⚠️ Could not mark message as read: ${error.message}`);
  }
};

export {
  sendSeen,
  sendTyping,
  sendOnlinePresence,
  sendHumanLikeMessage,
  simulateReadMessage,
};
