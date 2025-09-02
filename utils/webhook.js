import axios from "axios";
import logger from "../config/logger.js";
import config from "../config/config.js";

// Send data to webhook endpoint
const sendWebhook = async (payload) => {
  try {
    if (!config.webhook.enabled) {
      logger.debug("🔇 Webhook disabled, skipping webhook call");
      return { success: false, reason: "disabled" };
    }

    if (!config.webhook.endpoint) {
      logger.warn("⚠️ Webhook endpoint not configured");
      return { success: false, reason: "no_endpoint" };
    }

    logger.info("📤 Sending webhook data to:", config.webhook.endpoint);
    logger.debug("📋 Webhook payload:", payload);

    const response = await axios.post(config.webhook.endpoint, payload, {
      timeout: config.webhook.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "WhatsApp-API-Webhook/1.0",
      },
    });

    logger.info("✅ Webhook sent successfully", {
      status: response.status,
      statusText: response.statusText,
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    logger.error("❌ Error sending webhook:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    return {
      success: false,
      error: error.message,
      status: error.response?.status,
    };
  }
};

// Send webhook with retry logic
const sendWebhookWithRetry = async (payload, maxRetries = null) => {
  const retries = maxRetries || config.webhook.retries;
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`📤 Webhook attempt ${attempt}/${retries}`);
      const result = await sendWebhook(payload);

      if (result.success) {
        return result;
      }

      lastError = result;

      // Don't retry if webhook is disabled or no endpoint
      if (result.reason === "disabled" || result.reason === "no_endpoint") {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, etc.
        logger.info(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = { success: false, error: error.message };
      logger.error(`❌ Webhook attempt ${attempt} failed:`, error.message);
    }
  }

  logger.error(`❌ All webhook attempts failed after ${retries} tries`);
  return lastError;
};

export { sendWebhook, sendWebhookWithRetry };
