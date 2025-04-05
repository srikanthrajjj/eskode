const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory (frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Store connected clients and message history
const clients = {};
let messageCount = 0;
const messageHistory = [];
let totalConnections = 0;
let failedConnections = 0;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  totalConnections++;

  // Handle client registration
  socket.on('register', (userData) => {
    try {
      const { userId, userType } = userData;
      
      if (!userId || !userType) {
        socket.emit('error', { message: 'Invalid registration data' });
        return;
      }

      // Store client information
      clients[socket.id] = {
        userId,
        userType,
        connectedAt: new Date().toISOString()
      };

      socket.userId = userId;
      
      console.log(`Client registered: ${userId} (${userType})`);
      
      // Send welcome message
      socket.emit('message', {
        type: 'SYSTEM',
        payload: { text: `Welcome, ${userType}!` },
        senderId: 'system',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Registration error:', error);
      socket.emit('error', { message: 'Registration failed' });
    }
  });

  // Handle messages
  socket.on('message', (message) => {
    try {
      console.log(`Message received from ${socket.id}:`, message);
      
      // Store message in history
      messageHistory.push({
        ...message,
        senderId: socket.userId || socket.id,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast message to all clients
      io.emit('message', {
        ...message,
        senderId: socket.userId || socket.id,
        timestamp: new Date().toISOString()
      });
      
      messageCount++;
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete clients[socket.id];
  });

  // Handle errors
  socket.on('error', (error) => {
    failedConnections++;
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    connections: {
      total: totalConnections,
      active: Object.keys(clients).length,
      failed: failedConnections
    },
    messages: {
      total: messageCount,
      history: messageHistory.slice(-10) // Return last 10 messages
    }
  });
});

app.get('/api/clients', (req, res) => {
  const clientList = Object.keys(clients).map(userId => ({
    userId,
    userType: clients[userId].userType,
    connectedAt: clients[userId].connectedAt
  }));

  res.json(clientList);
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/status`);
  console.log(`Frontend available at http://localhost:${PORT}/`);
});
