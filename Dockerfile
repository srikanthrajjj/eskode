FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install required dependencies
RUN npm install express cors socket.io body-parser

# Copy server files
COPY mcp-server.js ./
COPY railway-server.js ./

# Expose the port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
CMD ["node", "railway-server.js"]
