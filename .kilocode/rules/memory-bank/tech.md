# WhatsApp API Technical Stack

## Core Technologies

### Backend Framework

- **Express.js 4.18.2**: Web application framework for Node.js
- **Node.js**: JavaScript runtime environment
- **ES6 Modules**: Modern import/export syntax throughout

### WhatsApp Integration

- **@whiskeysockets/baileys 6.7.5**: WhatsApp Web API library
- **fetchLatestBaileysVersion**: Ensures compatibility with latest WhatsApp updates
- **useMultiFileAuthState**: Session management and persistence

### Logging & Monitoring

- **Winston 3.11.0**: Professional logging library
- **Colored console output**: Development-friendly logging
- **File-based logging**: Combined and error log files
- **Context-aware logging**: Structured logging with metadata

### Utilities & Helpers

- **qrcode-terminal 0.12.0**: QR code display in terminal
- **dotenv 16.3.1**: Environment variable management
- **cors 2.8.5**: Cross-origin resource sharing

## Development Setup

### Prerequisites

- Node.js 18+ (ES6 modules support)
- npm or yarn package manager
- Terminal access for QR code scanning

### Installation

```bash
npm install
```

### Environment Configuration

```bash
# .env file
PORT=3001
NODE_ENV=development
SESSION_PATH=./auth_info_baileys
API_PREFIX=/api
```

### Running the Application

```bash
npm start
```

## Technical Constraints

### WhatsApp Limitations

- Single WhatsApp account per instance
- QR code authentication required for new sessions
- Rate limiting to prevent spam detection
- Session expiration requires re-authentication

### Performance Considerations

- In-memory message storage (last 100 messages)
- File-based session storage
- Single-threaded Node.js event loop
- Synchronous QR code generation

### Security Constraints

- Session files contain sensitive authentication data
- No built-in API authentication
- CORS enabled for all origins (development setting)
- Logs may contain sensitive message content

## Dependencies Analysis

### Production Dependencies

```json
{
  "@whiskeysockets/baileys": "^6.7.5", // WhatsApp Web API
  "express": "^4.18.2", // Web framework
  "qrcode-terminal": "^0.12.0", // QR code display
  "dotenv": "^16.3.1", // Environment variables
  "cors": "^2.8.5", // CORS middleware
  "winston": "^3.11.0" // Logging system
}
```

### Key Features by Dependency

- **Baileys**: Message sending/receiving, session management, group operations
- **Express**: REST API endpoints, middleware, routing
- **Winston**: Structured logging, file output, log levels
- **QR Terminal**: Authentication QR code display

## Tool Usage Patterns

### Development Workflow

1. **Start Application**: `npm start`
2. **Scan QR Code**: Terminal displays QR for WhatsApp authentication
3. **Test Endpoints**: Use `rest/message.rest` file for API testing
4. **Monitor Logs**: Check console output and log files

### API Testing

- **REST Client**: VS Code REST Client extension
- **Test File**: `rest/message.rest` with comprehensive test cases
- **Endpoints**: Send messages, get status, manage groups

### Debugging

- **Winston Logs**: Structured logging with timestamps and context
- **Console Output**: Colored logs for development
- **Error Handling**: Centralized error responses with context

### Session Management

- **Auto-save**: Sessions automatically saved to `auth_info_baileys/`
- **QR Generation**: Automatic QR code display for new sessions
- **Session Reset**: Manual and automatic session reset capabilities

## Architecture Patterns

### Code Organization

- **Modular Structure**: Separate concerns into distinct modules
- **Functional Programming**: No classes, using const functions
- **Async/Await**: Modern asynchronous JavaScript patterns
- **Error-First Callbacks**: Consistent error handling approach

### Configuration Management

- **Environment Variables**: Centralized configuration via .env
- **Config Module**: Single source of truth for application settings
- **Runtime Configuration**: Dynamic configuration based on environment

### Error Handling

- **Centralized Responses**: Consistent API response format
- **Async Wrappers**: Automatic error catching for async functions
- **Context Logging**: Error logging with function context
- **Graceful Degradation**: Continue operation despite non-critical errors
