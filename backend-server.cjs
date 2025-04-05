const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create Express app
const app = express();

// Configure middleware with CORS for Netlify
app.use(cors({
  origin: '*', // In production, you might want to restrict this to your Netlify domain
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: '*', // In production, you might want to restrict this to your Netlify domain
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
app.get('/', (req, res) => {
  res.send('Eskode3 API Server - Connect from your Netlify frontend');
});

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
  const clientList = Object.keys(clients).map(socketId => ({
    socketId,
    userId: clients[socketId].userId,
    userType: clients[socketId].userType,
    connectedAt: clients[socketId].connectedAt
  }));

  res.json(clientList);
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/status`);
});
