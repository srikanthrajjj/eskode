const http = require('http');
const { Server } = require('socket.io');

// Create an HTTP server
const server = http.createServer();

// Create a Socket.io server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*',  // Allow all origins in development
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],  // Start with polling, then upgrade to websocket
  allowEIO3: true
});

// Log all connection attempts
console.log('Socket.io server created with configuration:', {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Store connected clients with timestamps
const clients = {};

// Store messages for debugging with timestamp
const messageHistory = [];

// Store pending messages for offline users with expiry
const pendingMessages = {
  'victim-michael': []
};

// Initialize message count and connection stats
let messageCount = 0;
let totalConnections = 0;
let failedConnections = 0;

// Handle Socket.io connections
io.on('connection', (socket) => {
  totalConnections++;
  console.log(`Client connected: ${socket.id} (Total: ${totalConnections})`);

  // Handle user registration
  socket.on('register', (data) => {
    try {
      const { userId, userType } = data;
      console.log(`Client registered: ${userId} (${userType})`);

      // Store client info with timestamp
      clients[socket.id] = {
        userId,
        userType,
        socket,
        connectedAt: new Date().toISOString()
      };

      // If this is the victim connecting, send any pending messages
      if (userId === 'victim-michael' && pendingMessages[userId]?.length > 0) {
        console.log(`Sending ${pendingMessages[userId].length} pending messages to victim`);
        pendingMessages[userId].forEach(message => {
          socket.emit('message', message);
        });
        // Clear pending messages after sending
        pendingMessages[userId] = [];
      }

      // Notify all clients about new connection
      io.emit('message', {
        type: 'USER_CONNECTED',
        payload: { userId, userType },
        senderId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in register:', error);
      failedConnections++;
    }
  });

  // Handle ping to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
    failedConnections++;
  });

  // Handle messages
  socket.on('message', (message) => {
    try {
      console.log(`Received message from ${socket.id}:`, message);

      // Store message for debugging
      messageHistory.push({
        ...message,
        receivedAt: new Date().toISOString(),
        socketId: socket.id
      });

      // For NEW_CASE_ADDED messages, we need to ensure the victim receives it
      if (message.type === 'NEW_CASE_ADDED') {
        // Find the victim's socket
        const victimSocket = Object.values(clients).find(
          client => client.userId === 'victim-michael'
        );

        // Ensure the case has the correct crime number
        const caseWithCorrectCrimeNumber = {
          ...message,
          payload: {
            ...message.payload,
            crimeNumber: 'CRI45678/23' // Always use Michael Parker's crime number
          }
        };

        if (victimSocket) {
          console.log('Sending new case to victim:', caseWithCorrectCrimeNumber);
          victimSocket.socket.emit('message', caseWithCorrectCrimeNumber);
        } else {
          console.log('Victim offline, storing message for later delivery');
          pendingMessages['victim-michael'].push(caseWithCorrectCrimeNumber);
        }
      } else if (message.type === 'POLICE_TO_VICTIM_MESSAGE') {
        // Find the victim's socket
        const victimSocket = Object.values(clients).find(
          client => client.userId === 'victim-michael'
        );

        // Add crime number for routing if not present
        const messageWithCrimeNumber = {
          ...message,
          crimeNumber: message.crimeNumber || 'CRI45678/23', // Default to Michael Parker's crime number
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        };

        if (victimSocket) {
          console.log('Sending police message to victim:', messageWithCrimeNumber);
          victimSocket.socket.emit('message', messageWithCrimeNumber);
        } else {
          console.log('Victim offline, storing message for later delivery');
          pendingMessages['victim-michael'].push(messageWithCrimeNumber);
        }
      } else if (message.type === 'VICTIM_MESSAGE') {
        // Find the police officer's socket
        const policeSocket = Object.values(clients).find(
          client => client.userId === 'off1'
        );

        // Add crime number for routing if not present
        const messageWithCrimeNumber = {
          ...message,
          crimeNumber: message.crimeNumber || 'CRI45678/23', // Default to Michael Parker's crime number
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        };

        if (policeSocket) {
          console.log('Sending victim message to police:', messageWithCrimeNumber);
          policeSocket.socket.emit('message', messageWithCrimeNumber);
        } else {
          console.log('Police officer offline, broadcasting to all connected officers');

          // Find all connected police officers
          const policeOfficers = Object.values(clients).filter(
            client => client.userType === 'officer'
          );

          if (policeOfficers.length > 0) {
            console.log(`Broadcasting victim message to ${policeOfficers.length} connected officers`);
            policeOfficers.forEach(officer => {
              officer.socket.emit('message', messageWithCrimeNumber);
            });
          } else {
            console.log('No police officers connected, storing message for later delivery');
            // Could implement message storage for offline officers here
          }
        }
      } else if (message.type === 'MESSAGE_READ') {
        // Handle read receipts
        const recipientId = message.payload.recipientId;
        const recipientSocket = Object.values(clients).find(
          client => client.userId === recipientId
        );

        if (recipientSocket) {
          console.log('Sending read receipt:', message);
          recipientSocket.socket.emit('message', {
            ...message,
            senderId: socket.userId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('Recipient socket not found');
        }
      } else if (message.type === 'REQUEST_CASES') {
        // Victim is requesting their case list
        console.log('Victim requesting cases');

        // Default case that will always be included - Michael Parker's case
        const defaultCase = {
          id: 'case1',
          crimeNumber: 'CRI45678/23', // Michael Parker's crime number for consistent routing
          crimeType: 'THEFT',
          officerName: 'DC S. Morgan',
          victimName: 'MICHAEL PARKER',
          timestamp: new Date().toISOString()
        };

        // Find the requesting client
        const clientInfo = clients[socket.id];
        if (clientInfo && clientInfo.userType === 'victim') {
          // Send a CASE_LIST message back to the victim with at least the default case
          console.log('Sending case list to victim');
          socket.emit('message', {
            type: 'CASE_LIST',
            payload: {
              cases: [defaultCase]
            },
            senderId: 'system',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // For other messages, broadcast to all
        io.emit('message', {
          ...message,
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }

      messageCount++;
      console.log(`[SERVER STATS] Connected clients: ${io.sockets.sockets.size}, Messages: ${messageCount}`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (clients[socket.id]) {
      const { userId, userType } = clients[socket.id];

      // Notify all clients about disconnection
      io.emit('message', {
        type: 'USER_DISCONNECTED',
        payload: { userId, userType },
        senderId: userId,
        timestamp: new Date().toISOString()
      });

      // Remove client from memory
      delete clients[socket.id];
    }
  });
});

// Start the server with error handling
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';  // Listen on all network interfaces

server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying to close existing connection...`);
    require('child_process').exec(`npx kill-port ${PORT}`, (err) => {
      if (err) {
        console.error('Failed to kill port:', err);
      } else {
        console.log(`Port ${PORT} freed, restarting server...`);
        startServer();
      }
    });
  }
});

function startServer() {
  server.listen(PORT, HOST, () => {
    console.log(`WebSocket server running on ${HOST}:${PORT}`);
  });
}

startServer();

// Log server statistics every 30 seconds
setInterval(() => {
  const connectedClients = Object.keys(clients).length;
  console.log(`[SERVER STATS] Connected clients: ${connectedClients}, Total connections: ${totalConnections}, Failed: ${failedConnections}, Messages: ${messageCount}`);
}, 30000);