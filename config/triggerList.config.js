// Hardcoded trigger configuration
const triggerConfigList = {
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

export default triggerConfigList;
