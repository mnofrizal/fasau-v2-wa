import express from "express";
import cors from "cors";
import config from "./config/config.js";
import messageRoutes from "./routes/message.routes.js";
import triggerRoutes from "./routes/trigger.routes.js";
import { initializeWhatsApp } from "./services/whatsapp.service.js";
import logger from "./config/logger.js";

const app = express();

// Middleware
app.use(cors(config.api.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(`${config.server.apiPrefix}/message`, messageRoutes);
app.use(`${config.server.apiPrefix}/trigger`, triggerRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "WhatsApp API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "WhatsApp API Server",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      sendMessage: "POST /api/message/send",
      getMessages: "GET /api/message/received",
      clearMessages: "DELETE /api/message/received",
      getStatus: "GET /api/message/status",
      getTriggers: "GET /api/trigger",
      setTriggerStatus: "POST /api/trigger/status",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Start server
const startServer = () => {
  const port = config.server.port;

  app.listen(port, () => {
    logger.info("🚀 WhatsApp API Server started successfully!");
    logger.info(`📡 Server running on port ${port}`);
    logger.info(
      `🌐 API Base URL: http://localhost:${port}${config.server.apiPrefix}`
    );
    logger.info("📋 Available endpoints:");
    logger.info(`   - POST ${config.server.apiPrefix}/message/send`);
    logger.info(`   - GET  ${config.server.apiPrefix}/message/received`);
    logger.info(`   - DELETE ${config.server.apiPrefix}/message/received`);
    logger.info(`   - GET  ${config.server.apiPrefix}/message/status`);
    logger.info(`   - GET  ${config.server.apiPrefix}/message/groups`);
    logger.info(`   - POST ${config.server.apiPrefix}/message/reset-session`);
    logger.info(`   - GET  ${config.server.apiPrefix}/trigger (read-only)`);
    logger.info(
      `   - POST ${config.server.apiPrefix}/trigger/status (enable/disable)`
    );
    logger.info("");
    logger.info("🤖 Triggers enabled by default with hardcoded commands:");
    logger.info("   - .a1 → Siap Bos");
    logger.info("   - .help → Show available commands");
    logger.info("   - .ping → Pong! 🏓");
    logger.info("");

    // Initialize WhatsApp after server starts
    initializeWhatsApp();
  });
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("\n🛑 Shutting down WhatsApp API server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("\n🛑 Shutting down WhatsApp API server...");
  process.exit(0);
});

// Start the application
startServer();

export default app;
