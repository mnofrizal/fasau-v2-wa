# WhatsApp Image Upload Implementation Plan

## Overview

This document outlines the implementation plan for stream-based image upload functionality in the WhatsApp API. The approach uses direct buffer processing without temporary files for optimal performance and memory efficiency.

## Architecture

### Stream Processing Flow

```
WhatsApp Message → Download Buffer → Process Stream → Upload to Service → Return URL
```

### Key Components

1. **Media Download Service** - Downloads WhatsApp media as buffer
2. **Upload Service** - Handles buffer upload to external service
3. **Message Enhancement** - Integrates upload results into message processing
4. **Error Handling** - Robust error management for upload failures

## Implementation Steps

### Step 1: Install Required Dependencies

```bash
npm install multer form-data axios
```

### Step 2: Create Media Upload Service

**File:** `services/whatsapp-media.service.js`

```javascript
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";
import axios from "axios";
import logger from "../config/logger.js";

// Download media as buffer
const downloadMedia = async (message, sock) => {
  try {
    const buffer = await downloadMediaMessage(
      message,
      "buffer",
      {},
      {
        logger: logger,
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    return buffer;
  } catch (error) {
    logger.error("❌ Error downloading media:", error);
    throw error;
  }
};

// Upload buffer to external service
const uploadBuffer = async (buffer, metadata) => {
  try {
    const formData = new FormData();
    formData.append("file", buffer, {
      filename: metadata.filename,
      contentType: metadata.mimetype,
    });

    // Add additional metadata
    if (metadata.caption) {
      formData.append("caption", metadata.caption);
    }

    // Upload to your service (replace with actual endpoint)
    const response = await axios.post("YOUR_UPLOAD_ENDPOINT", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: "Bearer YOUR_API_KEY", // if needed
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return {
      success: true,
      url: response.data.url,
      fileId: response.data.id,
      size: buffer.length,
    };
  } catch (error) {
    logger.error("❌ Error uploading buffer:", error);
    throw error;
  }
};

export { downloadMedia, uploadBuffer };
```

### Step 3: Enhance Message Processing

**File:** `services/whatsapp-message.service.js` (modifications)

```javascript
// Add import
import { downloadMedia, uploadBuffer } from "./whatsapp-media.service.js";

// Enhanced extractMessageContent function
const extractMessageContent = async (sock, message) => {
  let messageText = "";
  let messageType = "unknown";
  let mediaData = null;

  if (message.message.conversation) {
    messageText = message.message.conversation;
    messageType = "text";
  } else if (message.message.imageMessage) {
    const imageMsg = message.message.imageMessage;
    messageText = imageMsg.caption || "[Image]";
    messageType = "image";

    // Handle image upload
    try {
      logger.info("📸 Processing image upload...");

      // Download image as buffer
      const buffer = await downloadMedia(message, sock);

      // Prepare metadata
      const metadata = {
        filename: `whatsapp_image_${Date.now()}.jpg`,
        mimetype: imageMsg.mimetype || "image/jpeg",
        caption: imageMsg.caption,
        fileLength: imageMsg.fileLength,
      };

      // Upload buffer
      mediaData = await uploadBuffer(buffer, metadata);

      // Update message text with upload result
      messageText = `[Image uploaded: ${mediaData.url}] ${messageText}`;

      logger.info("✅ Image uploaded successfully:", {
        url: mediaData.url,
        size: mediaData.size,
      });
    } catch (uploadError) {
      logger.error("❌ Failed to upload image:", uploadError);
      messageText = "[Image upload failed] " + messageText;
      mediaData = { error: uploadError.message };
    }
  }
  // ... rest of existing logic for other message types

  return { messageText, messageType, mediaData };
};
```

### Step 4: Update Message Processing Flow

**File:** `services/whatsapp-message.service.js` (processIncomingMessage function)

```javascript
// Process incoming message (updated)
const processIncomingMessage = async (sock, message) => {
  try {
    if (!message.key.fromMe && message.message) {
      // Extract sender information
      const { senderJid, isGroup, senderPhone, senderName } = extractSenderInfo(
        message.key,
        message
      );

      // Extract message content (now async for media processing)
      const { messageText, messageType, mediaData } =
        await extractMessageContent(sock, message);

      const messageData = {
        id: message.key.id,
        from: senderJid,
        senderPhone: senderPhone,
        senderName: senderName,
        isGroup: isGroup,
        timestamp: message.messageTimestamp,
        message: messageText,
        type: messageType,
        mediaData: mediaData, // Include media upload results
        receivedAt: new Date().toISOString(),
      };

      // Store message
      receivedMessages.push(messageData);

      // Enhanced logging
      const logContext = {
        messageId: messageData.id,
        sender: isGroup ? `Group: ${senderPhone}` : `Contact: ${senderPhone}`,
        type: messageType,
        hasMedia: !!mediaData,
        mediaUrl: mediaData?.url,
        length: messageText.length,
      };

      logger.info(`📨 Message received from ${logContext.sender}`, logContext);

      // Continue with existing trigger processing...
      await simulateReadMessage(sock, message.key);

      // Process triggers
      try {
        const triggerResult = await processTriggers(
          sock,
          messageData,
          message.key,
          message
        );
        // ... existing trigger logic
      } catch (triggerError) {
        logger.error("❌ Error processing triggers:", triggerError);
      }

      return messageData;
    }
  } catch (error) {
    // ... existing error handling
  }
};
```

### Step 5: Add Configuration

**File:** `config/config.js` (add upload settings)

```javascript
const config = {
  // ... existing config

  upload: {
    endpoint:
      process.env.UPLOAD_ENDPOINT ||
      "https://your-upload-service.com/api/upload",
    apiKey: process.env.UPLOAD_API_KEY || "",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024, // 16MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    timeout: parseInt(process.env.UPLOAD_TIMEOUT) || 30000, // 30 seconds
  },
};
```

### Step 6: Add API Endpoint for Upload Status

**File:** `controllers/message.controller.js` (add new endpoint)

```javascript
const getMediaUploads = asyncHandler(async (req, res) => {
  try {
    const messages = getReceivedMessages(100);
    const mediaMessages = messages.filter(
      (msg) => msg.type === "image" && msg.mediaData && msg.mediaData.url
    );

    const uploads = mediaMessages.map((msg) => ({
      messageId: msg.id,
      sender: msg.senderPhone,
      uploadUrl: msg.mediaData.url,
      uploadedAt: msg.receivedAt,
      fileSize: msg.mediaData.size,
    }));

    return sendSuccess(
      res,
      { uploads, count: uploads.length },
      "Media uploads retrieved"
    );
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to get media uploads",
      500,
      "getMediaUploads"
    );
  }
});

export {
  // ... existing exports
  getMediaUploads,
};
```

### Step 7: Add Route

**File:** `routes/message.routes.js` (add route)

```javascript
// Add route for media uploads
router.get("/uploads", getMediaUploads);
```

## Configuration Requirements

### Environment Variables

```bash
# .env file additions
UPLOAD_ENDPOINT=https://your-upload-service.com/api/upload
UPLOAD_API_KEY=your_api_key_here
MAX_FILE_SIZE=16777216
UPLOAD_TIMEOUT=30000
```

### Upload Service Requirements

Your upload service should:

1. Accept multipart/form-data requests
2. Return JSON response with `url` and `id` fields
3. Support the file types you want to handle
4. Have proper authentication if needed

Example response format:

```json
{
  "success": true,
  "url": "https://cdn.yourservice.com/uploads/image123.jpg",
  "id": "img_123456",
  "size": 245760
}
```

## Error Handling Strategy

### Upload Failures

1. **Network Errors**: Retry with exponential backoff
2. **File Too Large**: Log warning and continue without upload
3. **Invalid File Type**: Skip upload but process message
4. **Service Unavailable**: Store locally and retry later

### Memory Management

1. **Buffer Cleanup**: Buffers are automatically garbage collected
2. **Memory Monitoring**: Log memory usage for large files
3. **Size Limits**: Enforce maximum file size limits

## Testing

### Test Cases

1. **Small Images** (< 1MB): Should upload quickly
2. **Large Images** (> 10MB): Should handle without memory issues
3. **Invalid Images**: Should fail gracefully
4. **Network Failures**: Should retry appropriately
5. **Service Downtime**: Should continue message processing

### REST API Testing

**File:** `rest/media.rest`

```http
### Get media uploads
GET http://localhost:3001/api/message/uploads
Content-Type: application/json

### Send test message (for manual testing)
POST http://localhost:3001/api/message/send
Content-Type: application/json

{
  "to": "your_test_number",
  "message": "Send me an image to test upload functionality"
}
```

## Performance Considerations

### Memory Usage

- **Buffer Size**: Each image creates a buffer in memory
- **Concurrent Uploads**: Limit concurrent uploads to prevent memory spikes
- **Garbage Collection**: Ensure buffers are released after upload

### Network Efficiency

- **Streaming**: Use streams for very large files if needed
- **Compression**: Consider image compression before upload
- **Parallel Processing**: Handle multiple uploads concurrently

## Security Considerations

### File Validation

1. **MIME Type Checking**: Validate file types
2. **File Size Limits**: Enforce maximum file sizes
3. **Malware Scanning**: Consider virus scanning for uploaded files
4. **Content Filtering**: Check for inappropriate content if needed

### API Security

1. **Authentication**: Secure your upload endpoint
2. **Rate Limiting**: Prevent abuse of upload functionality
3. **Access Control**: Ensure proper permissions

## Monitoring and Logging

### Metrics to Track

1. **Upload Success Rate**: Percentage of successful uploads
2. **Upload Duration**: Time taken for each upload
3. **File Sizes**: Distribution of uploaded file sizes
4. **Error Types**: Categories of upload failures

### Log Examples

```javascript
// Success log
logger.info("✅ Image uploaded successfully", {
  messageId: "msg_123",
  sender: "1234567890",
  uploadUrl: "https://cdn.service.com/img123.jpg",
  fileSize: 245760,
  uploadDuration: 1250,
});

// Error log
logger.error("❌ Image upload failed", {
  messageId: "msg_124",
  sender: "1234567890",
  error: "Network timeout",
  fileSize: 1048576,
  retryCount: 2,
});
```

## Future Enhancements

### Possible Improvements

1. **Multiple Upload Services**: Support for different upload providers
2. **Image Processing**: Resize/optimize images before upload
3. **Caching**: Cache uploaded images to avoid re-uploading
4. **Webhooks**: Notify external systems of new uploads
5. **Database Integration**: Store upload metadata in database
6. **Batch Processing**: Handle multiple images in single request

### Scalability Options

1. **Queue System**: Use Redis/Bull for upload queue
2. **Worker Processes**: Separate upload processing from main thread
3. **CDN Integration**: Direct upload to CDN services
4. **Microservice**: Separate upload service from WhatsApp API

## Implementation Timeline

### Phase 1: Basic Implementation (1-2 days)

- [ ] Create media service
- [ ] Enhance message processing
- [ ] Add basic error handling
- [ ] Test with small images

### Phase 2: Production Ready (2-3 days)

- [ ] Add comprehensive error handling
- [ ] Implement retry logic
- [ ] Add monitoring and logging
- [ ] Performance testing

### Phase 3: Advanced Features (3-5 days)

- [ ] Add upload status endpoint
- [ ] Implement file validation
- [ ] Add configuration options
- [ ] Create comprehensive tests

## Conclusion

This stream-based approach provides an efficient, scalable solution for handling WhatsApp image uploads. The implementation integrates seamlessly with your existing architecture while maintaining the human-like behavior patterns and robust error handling that characterize your WhatsApp API.

The key advantages of this approach:

- **Memory Efficient**: Direct buffer processing without temporary files
- **Fast Processing**: Minimal I/O operations
- **Secure**: No temporary files to clean up
- **Scalable**: Handles multiple concurrent uploads
- **Maintainable**: Clean separation of concerns

Start with Phase 1 for basic functionality, then enhance with additional features as needed.
