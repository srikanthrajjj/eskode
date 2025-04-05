const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Create Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the dist directory
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

// Store connected clients
const clients = {};

// Store message history
const messageHistory = [];

// Store pending messages for offline users
const pendingMessages = {
  'victim-michael': []
};

// Initialize stats
let messageCount = 0;
let totalConnections = 0;
let failedConnections = 0;

// MCP Message Types
const MCP_MESSAGE_TYPES = {
  REGISTER: 'REGISTER',
  VICTIM_MESSAGE: 'VICTIM_MESSAGE',
  OFFICER_MESSAGE: 'OFFICER_MESSAGE',
  ADMIN_MESSAGE: 'ADMIN_MESSAGE',
  TASK_REQUEST: 'TASK_REQUEST',
  TASK_RESPONSE: 'TASK_RESPONSE',
  TYPING_INDICATOR: 'TYPING_INDICATOR',
  READ_RECEIPT: 'READ_RECEIPT',
  STATUS_UPDATE: 'STATUS_UPDATE',
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE'
};

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MCP Server is running',
    stats: {
      connections: Object.keys(clients).length,
      totalConnections,
      failedConnections,
      messageCount
    },
    clients: Object.values(clients).map(client => ({
      id: client.userId,
      type: client.userType,
      connected: !!client.socket
    }))
  });
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (Total: ${Object.keys(clients).length + 1})`);
  totalConnections++;

  // Handle client registration
  socket.on('register', (data) => {
    try {
      const { userId, userType } = data;
      console.log(`User registered: ${userId} (${userType})`);

      // Store client information
      clients[socket.id] = {
        socket,
        userId,
        userType,
        connected: true
      };

      // Send any pending messages
      if (pendingMessages[userId] && pendingMessages[userId].length > 0) {
        console.log(`Sending ${pendingMessages[userId].length} pending messages to ${userId}`);
        pendingMessages[userId].forEach(message => {
          socket.emit('message', message);
        });
        pendingMessages[userId] = [];
      }

      // Broadcast user status to all clients
      io.emit('status', {
        type: MCP_MESSAGE_TYPES.STATUS_UPDATE,
        userId,
        userType,
        status: 'online'
      });
    } catch (error) {
      console.error('Error in register handler:', error);
    }
  });

  // Handle messages
  socket.on('message', (message) => {
    try {
      console.log(`Message received from ${socket.id}:`, message.type);
      messageCount++;

      // Process message based on type
      switch (message.type) {
        case MCP_MESSAGE_TYPES.VICTIM_MESSAGE:
          handleVictimMessage(socket, message);
          break;
        case MCP_MESSAGE_TYPES.OFFICER_MESSAGE:
          handleOfficerMessage(socket, message);
          break;
        case MCP_MESSAGE_TYPES.ADMIN_MESSAGE:
          handleAdminMessage(socket, message);
          break;
        case MCP_MESSAGE_TYPES.TASK_REQUEST:
          handleTaskRequest(socket, message);
          break;
        case MCP_MESSAGE_TYPES.TYPING_INDICATOR:
          handleTypingIndicator(socket, message);
          break;
        case MCP_MESSAGE_TYPES.READ_RECEIPT:
          handleReadReceipt(socket, message);
          break;
        default:
          console.log(`Unknown message type: ${message.type}`);
      }

      // Store message in history
      messageHistory.push({
        timestamp: new Date(),
        socketId: socket.id,
        message
      });
    } catch (error) {
      console.error('Error in message handler:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      console.log(`Client disconnected: ${socket.id}`);

      // Get user info before removing
      const client = clients[socket.id];

      // Remove client from connected clients
      delete clients[socket.id];

      // Broadcast user status to all clients if we had user info
      if (client) {
        io.emit('status', {
          type: MCP_MESSAGE_TYPES.STATUS_UPDATE,
          userId: client.userId,
          userType: client.userType,
          status: 'offline'
        });
      }
    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  });
});

// Handle victim messages
function handleVictimMessage(socket, message) {
  try {
    console.log('Processing victim message:', message);

    // Find the admin user's socket
    const adminSocket = Object.values(clients).find(
      client => client.userType === 'admin'
    );

    if (adminSocket) {
      console.log('Sending victim message to admin user:', message);
      adminSocket.socket.emit('message', message);
    } else {
      console.log('Admin user offline, storing message for later delivery');
      // Store message for later delivery
      if (!pendingMessages['admin']) {
        pendingMessages['admin'] = [];
      }
      pendingMessages['admin'].push(message);
    }
  } catch (error) {
    console.error('Error in handleVictimMessage:', error);
  }
}

// Handle officer messages
function handleOfficerMessage(socket, message) {
  try {
    console.log('Processing officer message:', message);

    // Find the recipient's socket (admin)
    const adminSocket = Object.values(clients).find(
      client => client.userType === 'admin'
    );

    if (adminSocket) {
      console.log('Sending officer message to admin user:', message);
      adminSocket.socket.emit('message', message);
    } else {
      console.log('Admin user offline, storing message for later delivery');
      // Store message for later delivery
      if (!pendingMessages['admin']) {
        pendingMessages['admin'] = [];
      }
      pendingMessages['admin'].push(message);
    }
  } catch (error) {
    console.error('Error in handleOfficerMessage:', error);
  }
}

// Handle admin messages
function handleAdminMessage(socket, message) {
  try {
    console.log('Processing admin message:', message);

    // Check if this is a task request
    if (message.payload.taskRequest) {
      // Find the admin user's socket to send the task request to
      const adminSocket = Object.values(clients).find(
        client => client.userType === 'admin'
      );

      if (adminSocket) {
        console.log('Sending task request to admin user:', message);
        adminSocket.socket.emit('message', message);
      } else {
        console.log('Admin user offline, storing task request for later delivery');
        // You could implement a pending messages queue for admin users here
      }
    } else {
      // This is a regular admin message to an officer
      // Find the recipient officer's socket
      const recipientId = message.payload.recipientId;
      const officerSocket = Object.values(clients).find(
        client => client.userId === recipientId
      );

      if (officerSocket) {
        console.log(`Sending admin message to officer ${recipientId}:`, message);
        officerSocket.socket.emit('message', message);
      } else {
        console.log(`Officer ${recipientId} offline, storing message for later delivery`);
        // You could implement a pending messages queue for officers here
      }
    }
  } catch (error) {
    console.error('Error in handleAdminMessage:', error);
  }
}

// Handle task requests
function handleTaskRequest(socket, message) {
  try {
    console.log('Processing task request:', message);

    // Find the admin user's socket
    const adminSocket = Object.values(clients).find(
      client => client.userType === 'admin'
    );

    if (adminSocket) {
      console.log('Sending task request to admin user:', message);
      adminSocket.socket.emit('message', message);
    } else {
      console.log('Admin user offline, storing task request for later delivery');
      // Store message for later delivery
      if (!pendingMessages['admin']) {
        pendingMessages['admin'] = [];
      }
      pendingMessages['admin'].push(message);
    }
  } catch (error) {
    console.error('Error in handleTaskRequest:', error);
  }
}

// Handle typing indicators
function handleTypingIndicator(socket, message) {
  try {
    console.log('Processing typing indicator:', message);

    // Find the recipient's socket based on the recipient type
    let recipientSocket;

    if (message.payload.recipientType === 'admin') {
      recipientSocket = Object.values(clients).find(
        client => client.userType === 'admin'
      );
    } else if (message.payload.recipientType === 'officer') {
      recipientSocket = Object.values(clients).find(
        client => client.userId === message.payload.recipientId
      );
    }

    if (recipientSocket) {
      console.log(`Sending typing indicator to ${message.payload.recipientType}:`, message);
      recipientSocket.socket.emit('message', message);
    }
  } catch (error) {
    console.error('Error in handleTypingIndicator:', error);
  }
}

// Handle read receipts
function handleReadReceipt(socket, message) {
  try {
    console.log('Processing read receipt:', message);

    // Find the sender's socket
    const senderSocket = Object.values(clients).find(
      client => client.userId === message.payload.senderId
    );

    if (senderSocket) {
      console.log(`Sending read receipt to ${message.payload.senderId}:`, message);
      senderSocket.socket.emit('message', message);
    }
  } catch (error) {
    console.error('Error in handleReadReceipt:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/status`);
});
