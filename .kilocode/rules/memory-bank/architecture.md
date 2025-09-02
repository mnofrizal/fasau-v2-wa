# WhatsApp API Architecture

## System Architecture

The WhatsApp API follows a clean, modular architecture with clear separation of concerns:

```
whatsapp-api/
├── config/                    # Configuration layer
│   ├── config.js             # Centralized app configuration
│   ├── logger.js             # Winston logging setup
│   └── triggerList.config.js # Trigger configuration list
├── controllers/              # Request handling layer
│   ├── message.controller.js # Message & group controllers
│   └── trigger.controller.js # Trigger management controllers
├── services/                 # Business logic layer
│   ├── whatsapp.service.js   # Baileys WhatsApp integration
│   ├── whatsapp-trigger.service.js # Trigger system logic
│   └── whatsapp-message.service.js # Message processing with sender extraction
├── routes/                   # API routing layer
│   ├── message.routes.js     # REST API routes
│   └── trigger.routes.js     # Trigger API routes
├── utils/                    # Utility functions
│   ├── timing.js            # Random delays & timing
│   ├── humanBehavior.js     # Human-like messaging
│   ├── responseHandler.js   # Centralized API responses
│   ├── triggerHandlerList.js # Trigger handler functions
│   ├── ai.js                # AI utility functions (OpenRouter)
│   ├── ai.example.js        # AI usage examples
│   ├── amcloud.js           # Media upload utilities
│   └── ai.example.js        # AI usage examples
├── rest/                     # API testing
│   ├── message.rest         # REST client tests
│   └── trigger.rest         # Trigger API tests
├── auth_info_baileys/        # Session storage
├── logs/                     # Winston log files
└── app.js                    # Express application entry
```

## Key Technical Decisions

### 1. **ES6 Modules Architecture**

- All files use `import/export` syntax
- No classes, using `const` functions and object patterns
- Modern JavaScript with async/await throughout

### 2. **Layered Architecture**

- **Routes**: Handle HTTP requests and routing
- **Controllers**: Process requests, validate input, format responses
- **Services**: Business logic and external API integration
- **Utils**: Reusable utility functions and helpers

### 3. **Configuration Management**

- Centralized configuration in `config/config.js`
- Environment variables via `.env` file
- Separate logging configuration

### 4. **Error Handling Strategy**

- Centralized response handlers in `utils/responseHandler.js`
- Async error wrapper to catch unhandled promises
- Context-aware logging for debugging
- Graceful degradation for connection issues

## Component Relationships

### Express Application Flow

```
Request → Routes → Controllers → Services → Baileys → WhatsApp
                ↓
            Response Handlers ← Utils ← Logging
```

### WhatsApp Service Integration

```
app.js → initializeWhatsApp() → connectToWhatsApp() → makeWASocket()
                                      ↓
                              Event Handlers (connection, messages, errors)
                                      ↓
                              Human Behavior Utils → Timing Utils
```

## Critical Implementation Paths

### 1. **Message Sending Flow**

```
POST /api/message/send → message.controller.js → sendTextMessage()
                                ↓
                        whatsapp.service.js → sendMessage()
                                ↓
                        humanBehavior.js → sendHumanLikeMessage()
                                ↓
                        [seen → typing → send] → Baileys socket
```

### 2. **Session Management Flow**

```
Connection Error → Reconnection Logic → Attempt Counter
                                ↓
                        Max Attempts Reached → resetSession()
                                ↓
                        Clear auth_info_baileys/ → Fresh QR Code
```

### 3. **Human Behavior Simulation**

```
Message Request → getHumanTimings() → Random Delays
                        ↓
                sendOnlinePresence() → sendSeen() → sendTyping() → sendMessage()
```

### 4. **Trigger System Flow**

```
Incoming Message → processIncomingMessage() → processTriggers()
                                ↓
                        Trigger Match Found → triggerHandlerList.js
                                ↓
                        Message Processing (.a1: extract content, sender info)
                                ↓
                        Image Detection → downloadMediaMessage() → AMCloud Upload
                                ↓
                        AI Processing (optional) → OpenRouter API
                                ↓
                        Format Response (timestamp, reporter details, image URL)
                                ↓
                        Human Behavior → Quoted Reply → WhatsApp
```

### 5. **AI Integration Flow**

```
AI Request → ai.js → OpenRouter API
                        ↓
                Model Selection → API Call → Response Processing
                        ↓
                Error Handling → Structured Response → Application
```

### 6. **Media Processing Flow**

```
Image Message → detectImageMessage() → downloadMediaMessage()
                                ↓
                        Buffer Processing → AMCloud API → Upload with Description
                                ↓
                        URL Generation → Response Integration → WhatsApp Reply
```

## Design Patterns

### 1. **Service Layer Pattern**

- Business logic isolated in service files
- Controllers only handle HTTP concerns
- Services manage external dependencies (Baileys)

### 2. **Factory Pattern**

- Response handlers create consistent response objects
- Timing utilities generate randomized delays
- Configuration factory for environment-specific settings

### 3. **Observer Pattern**

- Baileys event listeners for connection updates
- Message event handlers for incoming messages
- Error event handlers for graceful error recovery

### 4. **Strategy Pattern**

- Different reconnection strategies based on error type
- Human behavior strategies for different message types
- Logging strategies for different environments

## Integration Points

### External Dependencies

- **@whiskeysockets/baileys**: WhatsApp Web API integration
- **express**: HTTP server framework
- **winston**: Professional logging system
- **qrcode-terminal**: QR code display for authentication

### Internal Dependencies

- **Config**: Centralized configuration management
- **Logger**: Structured logging throughout application
- **Utils**: Shared utilities for timing, behavior, responses
- **Session Storage**: File-based session persistence

## Scalability Considerations

### Current Architecture Supports

- Single WhatsApp instance per application
- In-memory message storage (last 100 messages)
- File-based session storage
- Single-threaded Express server

### Future Scaling Options

- Multiple WhatsApp instances with instance management
- Database integration for message persistence
- Redis for session storage in distributed environments
- Load balancing for multiple API instances
