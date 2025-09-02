// Test script to verify webhook functionality
import { sendWebhookWithRetry } from "./utils/webhook.js";
import config from "./config/config.js";

console.log("🧪 Testing Webhook Functionality\n");

// Display current webhook configuration
console.log("📋 Current Webhook Configuration:");
console.log(`- Endpoint: ${config.webhook.endpoint}`);
console.log(`- Timeout: ${config.webhook.timeout}ms`);
console.log(`- Retries: ${config.webhook.retries}`);
console.log(`- Enabled: ${config.webhook.enabled}`);
console.log("");

// Test payload matching the required format
const testPayload = {
  waUser: {
    name: "Doni Setiawan",
    phone: "087733760363",
  },
  task: {
    title: "Perbaikan Printer Kantor",
    category: "CM",
  },
  evidence:
    "https://cloud.amserver.site/media/cmf1ca8cp0000lj98e0ciuuq0/21e2dd58-66c1-4dc1-ba14-3977caa1733d.jpg",
  waMessageId: "24245523",
};

console.log("📤 Test Payload:");
console.log(JSON.stringify(testPayload, null, 2));
console.log("");

// Test webhook sending
console.log("🚀 Testing webhook send...");
try {
  const result = await sendWebhookWithRetry(testPayload);

  if (result.success) {
    console.log("✅ Webhook test successful!");
    console.log(`- Status: ${result.status}`);
    console.log(`- Response:`, result.data);
  } else {
    console.log("❌ Webhook test failed:");
    console.log(`- Reason: ${result.reason || result.error}`);
    console.log(`- Status: ${result.status || "N/A"}`);
  }
} catch (error) {
  console.log("❌ Webhook test error:", error.message);
}

console.log("\n📝 Test completed!");
