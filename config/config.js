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
  upload: {
    endpoint:
      process.env.UPLOAD_ENDPOINT || "http://localhost:4500/api/media/upload",
    apiKey: process.env.UPLOAD_API_KEY || "3d1e6afaf37a41358970932c7dc6fe14",
    timeout: parseInt(process.env.UPLOAD_TIMEOUT) || 30000,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024, // 16MB
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
};

export default config;
