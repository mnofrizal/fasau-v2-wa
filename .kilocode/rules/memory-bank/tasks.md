# WhatsApp API Tasks Documentation

## Debug Message Age Filter Issues

**Last performed:** September 2025
**Files to modify:**

- `services/whatsapp-message.service.js` - Message processing logic
- `services/whatsapp-trigger.service.js` - Trigger processing logic

**Steps:**

1. Add comprehensive logging to `processIncomingMessage()` function
2. Enhance `handleMessagesUpsert()` with batch processing logs
3. Implement proper early return for old messages
4. Ensure old messages are marked as read but skip trigger processing
5. Add debug logs to distinguish between processed vs skipped messages

**Important notes:**

- Old messages (>MESSAGE_AGE_THRESHOLD) should be marked as read but not trigger responses
- Use `simulateReadMessage()` for old messages before returning null
- Batch processing logs help identify which messages are being processed
- Message age is calculated as `(currentTime - messageTimestamp * 1000)`

**Example implementation:**

```javascript
if (messageAge > thresholdMs) {
  logger.info(`⏰ OLD MESSAGE - Marking as read but skipping triggers`);
  await simulateReadMessage(sock, message.key);
  return null; // Skip triggers and storage
}
```

## Fix Group Phone Number Extraction

**Last performed:** September 2025
**Files to modify:**

- `services/whatsapp-message.service.js` - `extractSenderInfo()` function
- `utils/triggerHandlerList.js` - Webhook payload generation

**Steps:**

1. Identify the correct field for group message sender phone numbers
2. Update extraction logic to prioritize `participantPn` over `participant`
3. Add fallback methods for different message structures
4. Implement phone number validation
5. Add comprehensive debug logging for sender extraction

**Important notes:**

- For group messages: `messageKey.participantPn` contains actual phone numbers
- For personal messages: `messageKey.remoteJid` contains sender phone
- `messageKey.participant` may contain non-phone identifiers
- Always validate extracted phone numbers with regex patterns
- Indonesian phone numbers typically start with 62 or 08

**Example implementation:**

```javascript
if (isGroup) {
  if (messageKey.participantPn) {
    // Priority 1: participantPn field
    senderPhone = messageKey.participantPn.split("@")[0];
  } else if (messageKey.participant) {
    // Fallback: participant field
    senderPhone = messageKey.participant.split("@")[0];
  }
}
```

## Add Comprehensive Debug Logging

**Last performed:** September 2025
**Files to modify:**

- `services/whatsapp-message.service.js` - All message processing functions

**Steps:**

1. Add batch processing logs in `handleMessagesUpsert()`
2. Add message structure debugging in `extractSenderInfo()`
3. Add message age filtering logs with timestamps
4. Add phone number validation and extraction method logs
5. Add clear distinction between processed vs skipped messages

**Important notes:**

- Use different log levels: `info` for important events, `debug` for detailed info
- Include message IDs in all logs for traceability
- Log both successful operations and failures
- Use structured logging with context objects
- Include timestamps in Indonesian timezone for better readability

**Example log patterns:**

```javascript
logger.info(`📥 BATCH: Processing ${messages.length} message(s)`);
logger.info(`⏰ OLD MESSAGE (${age}s old) - ID: ${messageId}`);
logger.debug(`📱 Group message - Method 1 (participantPn): ${phone}`);
```

## Troubleshoot WhatsApp Message Processing

**When to use:** When messages are not being processed correctly or triggers aren't working

**Debugging checklist:**

1. Check message age filtering logs
2. Verify sender information extraction
3. Confirm trigger matching logic
4. Validate webhook payload structure
5. Review batch processing logs

**Common issues:**

- Old messages triggering responses (check age filtering)
- Wrong phone numbers in webhooks (check sender extraction)
- Triggers not matching (check prefix logic)
- Messages not being marked as read (check simulateReadMessage)

**Debug tools created:**

- `test-debug-logs.js` - Instructions for analyzing debug output
- `debug-message-structure.js` - Baileys message structure analysis
- `test-message-age.js` - Message age filtering logic testing
- `test-group-sender.js` - Phone number extraction testing
