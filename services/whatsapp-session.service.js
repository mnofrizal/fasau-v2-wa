import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import config from "../config/config.js";
import logger from "../config/logger.js";

// Session management functions
const getAuthState = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      config.whatsapp.sessionPath
    );
    return { state, saveCreds };
  } catch (error) {
    logger.error("❌ Error getting auth state:", error);
    throw error;
  }
};

const resetSession = async () => {
  try {
    const sessionPath = config.whatsapp.sessionPath;
    logger.warn(
      "🔄 Resetting WhatsApp session due to persistent connection issues..."
    );

    if (fs.existsSync(sessionPath)) {
      // Remove all session files
      const files = fs.readdirSync(sessionPath);
      for (const file of files) {
        const filePath = path.join(sessionPath, file);
        fs.unlinkSync(filePath);
        logger.debug(`🗑️ Deleted session file: ${file}`);
      }
      logger.info("✅ Session files cleared successfully");
    }

    logger.info("🔄 Session reset completed");
    return { success: true, message: "Session reset successfully" };
  } catch (error) {
    logger.error("❌ Error resetting session:", error);
    throw error;
  }
};

const sessionExists = () => {
  try {
    const sessionPath = config.whatsapp.sessionPath;
    if (!fs.existsSync(sessionPath)) {
      return false;
    }

    const files = fs.readdirSync(sessionPath);
    // Check if there are any session files
    const sessionFiles = files.filter(
      (file) =>
        file.endsWith(".json") &&
        (file.includes("creds") ||
          file.includes("session") ||
          file.includes("pre-key"))
    );

    return sessionFiles.length > 0;
  } catch (error) {
    logger.error("❌ Error checking session existence:", error);
    return false;
  }
};

const getSessionInfo = () => {
  try {
    const sessionPath = config.whatsapp.sessionPath;

    if (!fs.existsSync(sessionPath)) {
      return {
        exists: false,
        path: sessionPath,
        files: [],
        totalFiles: 0,
      };
    }

    const files = fs.readdirSync(sessionPath);
    const sessionFiles = files.filter((file) => file.endsWith(".json"));

    const fileDetails = sessionFiles.map((file) => {
      const filePath = path.join(sessionPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        type: getFileType(file),
      };
    });

    return {
      exists: sessionFiles.length > 0,
      path: sessionPath,
      files: fileDetails,
      totalFiles: sessionFiles.length,
      lastModified:
        fileDetails.length > 0
          ? Math.max(...fileDetails.map((f) => f.modified.getTime()))
          : null,
    };
  } catch (error) {
    logger.error("❌ Error getting session info:", error);
    return {
      exists: false,
      path: config.whatsapp.sessionPath,
      files: [],
      totalFiles: 0,
      error: error.message,
    };
  }
};

const getFileType = (filename) => {
  if (filename.includes("creds")) return "credentials";
  if (filename.includes("session")) return "session";
  if (filename.includes("pre-key")) return "pre-key";
  if (filename.includes("sender-key")) return "sender-key";
  if (filename.includes("app-state")) return "app-state";
  return "unknown";
};

const cleanupOldSessions = async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const sessionPath = config.whatsapp.sessionPath;

    if (!fs.existsSync(sessionPath)) {
      return { cleaned: 0, message: "No session directory found" };
    }

    const files = fs.readdirSync(sessionPath);
    const now = Date.now();
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(sessionPath, file);
      const stats = fs.statSync(filePath);

      // Only clean up old session files, not current ones
      if (now - stats.mtime.getTime() > maxAge && file.endsWith(".json")) {
        fs.unlinkSync(filePath);
        logger.debug(`🧹 Cleaned up old session file: ${file}`);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`🧹 Cleaned up ${cleanedCount} old session files`);
    }

    return {
      cleaned: cleanedCount,
      message: `Cleaned up ${cleanedCount} old session files`,
    };
  } catch (error) {
    logger.error("❌ Error cleaning up old sessions:", error);
    throw error;
  }
};

const backupSession = async () => {
  try {
    const sessionPath = config.whatsapp.sessionPath;
    const backupPath = `${sessionPath}_backup_${Date.now()}`;

    if (!fs.existsSync(sessionPath)) {
      throw new Error("No session directory found to backup");
    }

    // Create backup directory
    fs.mkdirSync(backupPath, { recursive: true });

    // Copy all session files
    const files = fs.readdirSync(sessionPath);
    let copiedCount = 0;

    for (const file of files) {
      if (file.endsWith(".json")) {
        const sourcePath = path.join(sessionPath, file);
        const destPath = path.join(backupPath, file);
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
      }
    }

    logger.info(
      `💾 Session backup created: ${backupPath} (${copiedCount} files)`
    );

    return {
      success: true,
      backupPath,
      filesBackedUp: copiedCount,
      message: `Session backed up successfully to ${backupPath}`,
    };
  } catch (error) {
    logger.error("❌ Error backing up session:", error);
    throw error;
  }
};

export {
  getAuthState,
  resetSession,
  sessionExists,
  getSessionInfo,
  cleanupOldSessions,
  backupSession,
};
