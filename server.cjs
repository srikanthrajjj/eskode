const http = require('http');
const { Server } = require('socket.io');

// Create an HTTP server
const server = http.createServer();

// Create a Socket.io server
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for demo purposes
    methods: ['GET', 'POST']
  }
});

// Store connected clients
const clients = {};

// Store messages for debugging
const messageHistory = [];

// Initialize message count
let messageCount = 0;

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Handle user registration
  socket.on('register', (data) => {
    const { userId, userType } = data;
    
    console.log(`Client registered: ${userId} (${userType})`);
    
    // Store client info
    clients[socket.id] = { userId, userType, socket };
    
    // Notify all clients about new connection
    io.emit('message', {
      type: 'USER_CONNECTED',
      payload: { userId, userType },
      senderId: userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle messages
  socket.on('message', (message) => {
    try {
      // Message is already an object, no need to parse
      console.log(`Received message from ${socket.id}:`, message);
      
      // Handle registration message
      if (message.type === 'REGISTER') {
        const { userId, userType } = message;
        socket.userId = userId;
        socket.userType = userType;
        console.log(`Client registered: ${userId} (${userType})`);
        return;
      }
      
      // Handle case request message
      if (message.type === 'REQUEST_CASES') {
        console.log(`Handling case request for victim: ${message.payload.victimId}`);
        
        // In a real application, you would fetch cases from a database
        // For now, we'll send back the cases that were previously added
        const victimCases = messageHistory
          .filter(msg => msg.type === 'NEW_CASE_ADDED' && msg.payload.victimName === 'MICHAEL PARKER')
          .map(msg => ({
            id: msg.payload.id,
            crimeNumber: msg.payload.crimeNumber,
            crimeType: msg.payload.crimeType,
            officerName: msg.payload.officerName,
            timestamp: msg.payload.timestamp
          }));
        
        console.log(`Sending ${victimCases.length} cases to victim:`, victimCases);
        
        // Send the case list back to the requesting victim
        socket.emit('message', {
          type: 'CASE_LIST',
          payload: {
            cases: victimCases
          }
        });
        return;
      }
      
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
        
        if (victimSocket) {
          console.log('Sending new case to victim:', message);
          victimSocket.socket.emit('message', {
            type: 'NEW_CASE_ADDED',
            payload: message.payload,
            senderId: socket.userId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('Victim socket not found');
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
  
  // Debug endpoint to get all messages
  socket.on('get_message_history', () => {
    socket.emit('message_history', messageHistory);
  });
  
  // Debug endpoint to get connected clients
  socket.on('get_clients', () => {
    const clientList = Object.keys(clients).map(id => ({
      socketId: id,
      userId: clients[id].userId,
      userType: clients[id].userType
    }));
    socket.emit('client_list', clientList);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Log server statistics every 30 seconds
setInterval(() => {
  const connectedClients = Object.keys(clients).length;
  console.log(`[SERVER STATS] Connected clients: ${connectedClients}, Messages: ${messageCount}`);
}, 30000); 