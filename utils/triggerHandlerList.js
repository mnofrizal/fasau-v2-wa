import logger from "../config/logger.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { uploadImage } from "./amcloud.js";
import { sendReaction } from "../services/whatsapp-message.service.js";

// Helper function to format timestamp in Indonesian locale
const formatTimestamp = () => {
  const now = new Date();
  const options = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  return now.toLocaleString("id-ID", options);
};

// Helper function to format media type for display
const formatMediaType = (messageType) => {
  const typeMap = {
    text: "Teks",
    extended_text: "Teks",
    image: "Gambar",
    video: "Video",
    audio: "Audio",
    document: "Dokumen",
    sticker: "Stiker",
    location: "Lokasi",
    contact: "Kontak",
  };
  return typeMap[messageType] || "Media";
};

// Helper function to process image upload
const processImageUpload = async (originalMessage, reportContent) => {
  try {
    logger.info("🖼️ Processing image for .a1 report...");

    // Download the image from WhatsApp
    const buffer = await downloadMediaMessage(originalMessage, "buffer", {});

    if (!buffer) {
      throw new Error("Failed to download image buffer");
    }

    // Extract image metadata
    const imageMessage = originalMessage.message.imageMessage;
    const metadata = {
      filename: `report_${Date.now()}.jpg`,
      mimetype: imageMessage.mimetype || "image/jpeg",
      description: reportContent, // Use report content as description for AMCloud
      fileLength: buffer.length,
    };

    logger.info("📤 Uploading image to AMCloud...", {
      size: buffer.length,
      mimetype: metadata.mimetype,
      description: metadata.description,
    });

    // Upload to AMCloud
    const uploadResult = await uploadImage(buffer, metadata);

    logger.info("✅ Image uploaded successfully", {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
    });

    return uploadResult.url;
  } catch (error) {
    logger.error("❌ Error processing image for .a1 report:", error);
    return null;
  }
};

// Handler for .a1 reports
const handleA1Report = async (
  messageText,
  senderInfo,
  originalMessage,
  sock,
  originalMessageKey
) => {
  // Remove the .a1 prefix and trim
  const reportContent = messageText.replace(/^\.a1\s*/, "").trim();

  // Validate input
  if (!reportContent) {
    return "Format: .a1 <pesan laporan>\nContoh: .a1 laporan ada kerusakan plafond";
  }

  // Log sender info for debugging
  logger.debug("Processing A1 report with sender info:", senderInfo);

  // Determine message type for display
  const messageType = senderInfo.messageType || "text";

  // Process image upload if message contains image
  let imageUrl = null;
  if (messageType === "image" && originalMessage && sock) {
    imageUrl = await processImageUpload(originalMessage, reportContent);
  }

  // Create formatted report response
  const response = `📋 LAPORAN DITERIMA

Image URL: ${imageUrl || "No Image"}

Pelapor: ${senderInfo.name || "Unknown"}
Nomor HP: ${senderInfo.phoneNumber}
Waktu: ${formatTimestamp()}
Tipe: ${formatMediaType(messageType)}
Pesan: ${reportContent}

Status: ✅ Laporan telah diterima dan akan diproses`;

  // Send thumbs up reaction to the original message
  try {
    if (originalMessageKey && sock) {
      logger.info("👍 Sending thumbs up reaction to .a1 report message");
      await sendReaction(sock, originalMessageKey, "👍");
      logger.info("✅ Thumbs up reaction sent successfully");
    }
  } catch (reactionError) {
    logger.warn("⚠️ Failed to send thumbs up reaction:", reactionError.message);
    // Don't throw error, continue with normal response
  }

  return response;
};

// Export all handlers
const triggerHandlerList = {
  handleA1Report,
};

export default triggerHandlerList;
export { handleA1Report, formatTimestamp, formatMediaType, processImageUpload };
