FROM node:20-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-slim as production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./server.cjs

# Expose the ports
EXPOSE 5173
EXPOSE 3001

# Start both the Vite preview server and WebSocket server
CMD ["npm", "run", "start"] 