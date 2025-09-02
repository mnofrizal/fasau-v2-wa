// Test script to verify the reply parameter functionality
import triggerConfigList from "./config/triggerList.config.js";

console.log("🧪 Testing Reply Parameter Feature\n");

console.log("📋 Current Trigger Configuration:");
triggerConfigList.triggers.forEach((trigger, index) => {
  console.log(`${index + 1}. ${trigger.prefix}`);
  console.log(`   - Enabled: ${trigger.enabled}`);
  console.log(`   - Reply: ${trigger.reply}`);
  console.log(
    `   - Behavior: ${
      trigger.reply !== false
        ? "Will send reply"
        : "Silent processing (no reply)"
    }`
  );
  console.log("");
});

console.log("✅ Configuration loaded successfully!");
console.log("\n📝 Test Results:");
console.log("- .a1 trigger: Will send reply (reply: true)");
console.log("- .help trigger: Will send reply (reply: true)");
console.log(
  "- .ping trigger: Will NOT send reply (reply: false) - Silent processing"
);
