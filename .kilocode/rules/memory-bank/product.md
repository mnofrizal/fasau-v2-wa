# WhatsApp API Product Documentation

## Purpose

A simple yet powerful WhatsApp API endpoint built with Express.js and Baileys library that enables programmatic WhatsApp messaging with human-like behavior to avoid detection and bans.

## Problems It Solves

1. **WhatsApp Automation**: Enables automated WhatsApp messaging for businesses and applications
2. **Human-like Behavior**: Prevents bot detection through realistic typing indicators, read receipts, and timing
3. **Session Management**: Handles WhatsApp Web sessions with automatic recovery and reset capabilities
4. **Error Resilience**: Robust error handling for connection issues, bans, and encryption problems
5. **Group Management**: Provides access to WhatsApp group information and messaging

## Core Features

### Messaging

- Send text messages with human-like behavior (seen → typing → send)
- Receive and store incoming messages
- Automatic read receipts for incoming messages
- Random timing delays (1-3 seconds) to simulate human behavior

### Session Management

- Persistent session storage in `auth_info_baileys/` folder
- Automatic QR code generation for new sessions
- Smart reconnection with exponential backoff
- Automatic session reset after 2 minutes of failed reconnections
- Manual session reset endpoint for troubleshooting

### Group Features

- Retrieve all WhatsApp groups with detailed information
- Group participant lists with admin status
- Group metadata (name, description, creation date)

### Advanced Features

- Beautiful Winston logging system
- Centralized response handlers
- PreKeyError handling for updated Baileys versions
- Human behavior simulation utilities
- Comprehensive REST API testing file

## User Experience Goals

- **Zero Configuration**: Auto-starts WhatsApp service with Express server
- **Self-Healing**: Automatically recovers from connection issues and bans
- **Developer Friendly**: Clean APIs with consistent response formats
- **Production Ready**: Professional logging and error handling
- **Easy Testing**: Comprehensive REST file for API testing

## Target Use Cases

- Business automation and customer service
- Bulk messaging with natural behavior
- WhatsApp bot development
- Group management and messaging
- Integration with existing applications
