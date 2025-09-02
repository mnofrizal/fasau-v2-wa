# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for sessions (if needed by Baileys)
RUN mkdir -p auth_info_baileys

# Expose port (adjust if your app uses different port)
EXPOSE 4620

# Start the application
CMD ["npm", "start"]