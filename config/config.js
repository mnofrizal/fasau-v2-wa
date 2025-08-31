import dotenv from "dotenv";

dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    apiPrefix: process.env.API_PREFIX || "/api",
  },
  whatsapp: {
    sessionPath: process.env.SESSION_PATH || "./auth_info_baileys",
    webhookUrl: process.env.WEBHOOK_URL || "",
    markOnlineOnConnect: true,
    syncFullHistory: false,
  },
  api: {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  },
};

export default config;
