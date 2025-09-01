import FormData from "form-data";
import axios from "axios";
import logger from "../config/logger.js";
import config from "../config/config.js";

/**
 * Upload media buffer to AMCloud API
 * @param {Buffer} buffer - The media file buffer
 * @param {Object} metadata - File metadata
 * @param {string} metadata.filename - Original filename
 * @param {string} metadata.mimetype - MIME type of the file
 * @param {string} [metadata.caption] - Optional caption
 * @param {number} [metadata.fileLength] - Original file size
 * @returns {Promise<Object>} Upload result with publicUrl
 */
const uploadMedia = async (buffer, metadata) => {
  try {
    logger.info("🌥️ Uploading media to AMCloud...", {
      filename: metadata.filename,
      mimetype: metadata.mimetype,
      size: buffer.length,
    });

    // Create form data
    const formData = new FormData();
    formData.append("file", buffer, {
      filename: metadata.filename,
      contentType: metadata.mimetype,
    });

    // Upload to AMCloud API
    const response = await axios.post(config.upload.endpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-API-Key": config.upload.apiKey,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: config.upload.timeout || 30000,
    });

    // Extract data from AMCloud response
    const responseData = response.data;

    if (!responseData.success) {
      throw new Error(
        `AMCloud upload failed: ${responseData.message || "Unknown error"}`
      );
    }

    const result = {
      success: responseData.success,
      url: responseData.data.publicUrl,
      thumbnailUrl: responseData.data.thumbnailUrl,
      fileId: responseData.data.id,
      filename: responseData.data.filename,
      originalName: responseData.data.originalName,
      mimeType: responseData.data.mimeType,
      originalSize: metadata.fileLength || buffer.length,
      optimizedSize: responseData.data.size,
      path: responseData.data.path,
      userId: responseData.data.userId,
      message: responseData.message,
      uploadedAt: responseData.timestamp,
      createdAt: responseData.data.createdAt,
    };

    logger.info("✅ Media uploaded successfully to AMCloud", {
      publicUrl: result.url,
      fileId: result.fileId,
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      optimization: result.message,
    });

    return result;
  } catch (error) {
    logger.error("❌ Error uploading media to AMCloud:", {
      error: error.message,
      filename: metadata.filename,
      size: buffer.length,
      endpoint: config.upload.endpoint,
    });

    // Re-throw with more context
    throw new Error(`AMCloud upload failed: ${error.message}`);
  }
};

/**
 * Upload image buffer to AMCloud API
 * @param {Buffer} buffer - The image file buffer
 * @param {Object} metadata - Image metadata
 * @returns {Promise<Object>} Upload result with publicUrl
 */
const uploadImage = async (buffer, metadata) => {
  // Validate image MIME type
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedImageTypes.includes(metadata.mimetype)) {
    throw new Error(`Unsupported image type: ${metadata.mimetype}`);
  }

  return await uploadMedia(buffer, metadata);
};

/**
 * Upload video buffer to AMCloud API
 * @param {Buffer} buffer - The video file buffer
 * @param {Object} metadata - Video metadata
 * @returns {Promise<Object>} Upload result with publicUrl
 */
const uploadVideo = async (buffer, metadata) => {
  // Validate video MIME type
  const allowedVideoTypes = [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
  ];
  if (!allowedVideoTypes.includes(metadata.mimetype)) {
    throw new Error(`Unsupported video type: ${metadata.mimetype}`);
  }

  return await uploadMedia(buffer, metadata);
};

export { uploadMedia, uploadImage, uploadVideo, uploadDocument, uploadAudio };
