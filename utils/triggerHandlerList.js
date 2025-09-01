import logger from "../config/logger.js";

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

// Handler for .a1 reports
const handleA1Report = (messageText, senderInfo) => {
  // Remove the .a1 prefix and trim
  const reportContent = messageText.replace(/^\.a1\s*/, "").trim();

  // If no content after .a1, show usage
  if (!reportContent) {
    return "Format: .a1 <pesan laporan>\nContoh: .a1 laporan ada kerusakan plafond";
  }

  // Log sender info for debugging
  logger.debug("Processing A1 report with sender info:", senderInfo);

  // Determine message type for display
  const messageType = senderInfo.messageType || "text";

  // Create formatted report response with media type information (always show type)
  const response = `📋 LAPORAN DITERIMA

Pelapor: ${senderInfo.name || "Unknown"}
Nomor HP: ${senderInfo.phoneNumber}
Waktu: ${formatTimestamp()}
Tipe: ${formatMediaType(messageType)}
Pesan: ${reportContent}

Status: ✅ Laporan telah diterima dan akan diproses`;

  return response;
};

// Export all handlers
const triggerHandlerList = {
  handleA1Report,
};

export default triggerHandlerList;
export { handleA1Report, formatTimestamp, formatMediaType };
