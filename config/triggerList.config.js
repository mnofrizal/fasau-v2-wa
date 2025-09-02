// Hardcoded trigger configuration
const triggerConfigList = {
  globalEnabled: true, // Default enabled
  triggers: [
    {
      prefix: ".a1",
      type: "function", // Special function-based trigger
      handler: "handleA1Report",
      enabled: true,
      reply: false, // Will send reply message
    },
    {
      prefix: ".help",
      response:
        "📋 AVAILABLE COMMANDS:\n\n.a1 <pesan> - Buat laporan dengan format khusus\n  Contoh: .a1 laporan ada kerusakan plafond\n\n.help - Show this help\n.ping - Pong! 🏓",
      enabled: true,
      reply: true, // Will send reply message
    },
    {
      prefix: ".ping",
      response: "Pong! 🏓",
      enabled: true,
      reply: false, // Will not send reply message (silent processing)
    },
  ],
};

export default triggerConfigList;
