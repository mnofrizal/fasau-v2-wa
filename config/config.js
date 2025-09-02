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
    messageAgeThreshold: parseInt(process.env.MESSAGE_AGE_THRESHOLD) || 60, // seconds
  },
  webhook: {
    endpoint:
      process.env.WEBHOOK_ENDPOINT ||
      "http://localhost:4600/api/webhook/whatsapp",
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 10000, // 10 seconds
    retries: parseInt(process.env.WEBHOOK_RETRIES) || 3,
    enabled: process.env.WEBHOOK_ENABLED !== "false", // Default enabled
  },
  api: {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  },
  upload: {
    endpoint:
      process.env.UPLOAD_ENDPOINT || "http://localhost:4500/api/media/upload",
    apiKey: process.env.UPLOAD_API_KEY || "3d1e6afaf37a41358970932c7dc6fe14",
    timeout: parseInt(process.env.UPLOAD_TIMEOUT) || 30000,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: {
      images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      videos: ["video/mp4", "video/avi", "video/mov", "video/wmv"],
      documents: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
    },
  },
  ai: {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      endpoint:
        process.env.OPENROUTER_ENDPOINT ||
        "https://openrouter.ai/api/v1/chat/completions",
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
      timeout: parseInt(process.env.OPENROUTER_TIMEOUT) || 30000,
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 4000,
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
    },
  },
};

export default config;
