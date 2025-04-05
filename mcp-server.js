import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';

// Create Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  POLICE_TO_VICTIM_MESSAGE: 'POLICE_TO_VICTIM_MESSAGE',
  NEW_CASE_ADDED: 'NEW_CASE_ADDED',
  NEW_APPOINTMENT: 'NEW_APPOINTMENT',
  APPOINTMENT_RESPONSE: 'APPOINTMENT_RESPONSE',
  VCOP_UPDATE: 'VCOP_UPDATE',
  ZOORIE_UPDATE: 'ZOORIE_UPDATE',
  NEW_TASK: 'NEW_TASK',
  REQUEST_CASES: 'REQUEST_CASES',
  ADMIN_MESSAGE: 'ADMIN_MESSAGE',
  OFFICER_MESSAGE: 'OFFICER_MESSAGE',
  TYPING_INDICATOR: 'TYPING_INDICATOR',
  MESSAGE_READ: 'MESSAGE_READ'
};

// Message handler functions
function handleRegister(socket, data) {
  try {
    const { userId, userType } = data;

    if (!userId) {
      console.error('Registration failed: No userId provided');
      return;
    }

    // Store client information
    clients[userId] = {
      socket,
      userId,
      userType: userType || 'unknown',
      connectedAt: new Date().toISOString()
    };

    // Attach userId to socket for easy reference
    socket.userId = userId;

    console.log(`User registered: ${userId} (${userType || 'unknown'})`);

    // Send any pending messages
    if (pendingMessages[userId] && pendingMessages[userId].length > 0) {
      console.log(`Sending ${pendingMessages[userId].length} pending messages to ${userId}`);
      pendingMessages[userId].forEach(message => {
        socket.emit('message', message);
      });
      pendingMessages[userId] = [];
    }

    // If this is the victim, send default case
    if (userId === 'victim-michael') {
      // Default case that will always be included - Michael Parker's case
      const defaultCase = {
        id: 'case1',
        crimeNumber: 'CRI45678/23',
        crimeType: 'THEFT',
        officerName: 'DC S. Morgan',
        victimName: 'MICHAEL PARKER',
        timestamp: new Date().toISOString()
      };

      // Send default case to victim
      socket.emit('message', {
        type: 'NEW_CASE_ADDED',
        payload: defaultCase,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in handleRegister:', error);
  }
}

function handleVictimMessage(socket, message) {
  try {
    // Find the police officer's socket
    const policeSocket = Object.values(clients).find(
      client => client.userId === 'off1'
    );

    // Add crime number for routing if not present
    const messageWithCrimeNumber = {
      ...message,
      crimeNumber: message.crimeNumber || 'CRI45678/23',
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
  } catch (error) {
    console.error('Error in handleVictimMessage:', error);
  }
}

function handlePoliceToVictimMessage(socket, message) {
  try {
    // Find the victim's socket
    const victimSocket = Object.values(clients).find(
      client => client.userId === 'victim-michael'
    );

    // Add crime number for routing if not present
    const messageWithCrimeNumber = {
      ...message,
      crimeNumber: message.crimeNumber || 'CRI45678/23',
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
  } catch (error) {
    console.error('Error in handlePoliceToVictimMessage:', error);
  }
}

function handleNewCaseAdded(socket, message) {
  try {
    // Find the victim's socket
    const victimSocket = Object.values(clients).find(
      client => client.userId === 'victim-michael'
    );

    // Ensure the case has the correct crime number
    const caseWithCorrectCrimeNumber = {
      ...message,
      payload: {
        ...message.payload,
        crimeNumber: 'CRI45678/23'
      }
    };

    if (victimSocket) {
      console.log('Sending new case to victim:', caseWithCorrectCrimeNumber);
      victimSocket.socket.emit('message', caseWithCorrectCrimeNumber);
    } else {
      console.log('Victim offline, storing message for later delivery');
      pendingMessages['victim-michael'].push(caseWithCorrectCrimeNumber);
    }
  } catch (error) {
    console.error('Error in handleNewCaseAdded:', error);
  }
}

function handleNewAppointment(socket, message) {
  try {
    // Find the victim's socket
    const victimSocket = Object.values(clients).find(
      client => client.userId === 'victim-michael'
    );

    if (victimSocket) {
      console.log('Sending new appointment to victim:', message);
      victimSocket.socket.emit('message', message);
    } else {
      console.log('Victim offline, storing appointment for later delivery');
      pendingMessages['victim-michael'].push(message);
    }
  } catch (error) {
    console.error('Error in handleNewAppointment:', error);
  }
}

function handleAppointmentResponse(socket, message) {
  try {
    // Find the police officer's socket
    const policeSocket = Object.values(clients).find(
      client => client.userId === 'off1'
    );

    if (policeSocket) {
      console.log('Sending appointment response to police:', message);
      policeSocket.socket.emit('message', message);
    } else {
      console.log('Police officer offline, broadcasting to all connected officers');

      // Find all connected police officers
      const policeOfficers = Object.values(clients).filter(
        client => client.userType === 'officer'
      );

      if (policeOfficers.length > 0) {
        console.log(`Broadcasting appointment response to ${policeOfficers.length} connected officers`);
        policeOfficers.forEach(officer => {
          officer.socket.emit('message', message);
        });
      }
    }
  } catch (error) {
    console.error('Error in handleAppointmentResponse:', error);
  }
}

function handleVCOPUpdate(socket, message) {
  try {
    console.log('Handling VCOP update:', message);

    // Find the victim's socket
    const victimSocket = Object.values(clients).find(
      client => client.userId === 'victim-michael'
    );

    if (victimSocket) {
      console.log('Sending VCOP update to victim:', message);
      // Send the message with the correct type
      victimSocket.socket.emit('message', {
        type: 'VCOP_UPDATE',
        ...message
      });
    } else {
      console.log('Victim offline, storing VCOP update for later delivery');
      pendingMessages['victim-michael'].push({
        type: 'VCOP_UPDATE',
        ...message
      });
    }
  } catch (error) {
    console.error('Error in handleVCOPUpdate:', error);
  }
}

function handleZoorieUpdate(socket, message) {
  try {
    console.log('Handling ZOORIE update:', message);

    // Find the victim's socket
    const victimSocket = Object.values(clients).find(
      client => client.userId === 'victim-michael'
    );

    if (victimSocket) {
      console.log('Sending ZOORIE update to victim:', message);
      // Send the message with the correct type
      victimSocket.socket.emit('message', {
        type: 'ZOORIE_UPDATE',
        ...message
      });
    } else {
      console.log('Victim offline, storing ZOORIE update for later delivery');
      pendingMessages['victim-michael'].push({
        type: 'ZOORIE_UPDATE',
        ...message
      });
    }
  } catch (error) {
    console.error('Error in handleZoorieUpdate:', error);
  }
}

function handleNewTask(socket, message) {
  try {
    console.log('Handling new task:', message);

    // Find all admin sockets
    const adminSockets = Object.values(clients).filter(
      client => client.userType === 'admin'
    );

    if (adminSockets.length > 0) {
      console.log(`Broadcasting new task to ${adminSockets.length} admin users`);

      // Broadcast the task to all admin users
      adminSockets.forEach(admin => {
        admin.socket.emit('message', {
          type: 'NEW_TASK',
          payload: message,
          senderId: socket.userId || 'system',
          timestamp: new Date().toISOString()
        });
      });
    } else {
      console.log('No admin users online to receive the task');
    }
  } catch (error) {
    console.error('Error in handleNewTask:', error);
  }
}

function handleRequestCases(socket, message) {
  try {
    console.log('Victim requesting cases');

    // Default case for Michael Parker
    const defaultCase = {
      id: 'case1',
      crimeNumber: 'CRI45678/23',
      crimeType: 'THEFT',
      officerName: 'DC S. Morgan',
      victimName: 'MICHAEL PARKER',
      timestamp: new Date().toISOString()
    };

    // Send case list to victim
    console.log('Sending case list to victim');
    socket.emit('message', {
      type: 'CASE_LIST',
      payload: [defaultCase],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in handleRequestCases:', error);
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

// Handle officer messages
function handleOfficerMessage(socket, message) {
  try {
    console.log('Processing officer message:', message);

    // Find the admin user's socket
    const adminSocket = Object.values(clients).find(
      client => client.userType === 'admin'
    );

    if (adminSocket) {
      console.log('Sending officer message to admin user:', message);
      adminSocket.socket.emit('message', message);
    } else {
      console.log('Admin user offline, storing message for later delivery');
      // You could implement a pending messages queue for admin users here
    }

    // Also send the message back to the sender for confirmation
    socket.emit('message', {
      ...message,
      confirmed: true
    });
  } catch (error) {
    console.error('Error in handleOfficerMessage:', error);
  }
}

// Handle typing indicator messages
function handleTypingIndicator(socket, message) {
  try {
    console.log('Processing typing indicator:', message);

    // Determine the recipient based on the sender's type
    let recipientType;
    if (socket.userType === 'officer') {
      recipientType = 'admin';
    } else if (socket.userType === 'admin') {
      recipientType = 'officer';
    } else {
      return; // Unknown user type
    }

    // Find all recipients of the specified type
    const recipients = Object.values(clients).filter(
      client => client.userType === recipientType
    );

    // Send typing indicator to all recipients
    recipients.forEach(recipient => {
      recipient.socket.emit('message', message);
    });
  } catch (error) {
    console.error('Error in handleTypingIndicator:', error);
  }
}

// Handle message read receipts
function handleMessageRead(socket, message) {
  try {
    console.log('Processing message read receipt:', message);

    // Determine the recipient based on the sender's type
    let recipientType;
    if (socket.userType === 'officer') {
      recipientType = 'admin';
    } else if (socket.userType === 'admin') {
      recipientType = 'officer';
    } else {
      return; // Unknown user type
    }

    // Find all recipients of the specified type
    const recipients = Object.values(clients).filter(
      client => client.userType === recipientType
    );

    // Send read receipt to all recipients
    recipients.forEach(recipient => {
      recipient.socket.emit('message', message);
    });
  } catch (error) {
    console.error('Error in handleMessageRead:', error);
  }
}

// Message handlers object
const messageHandlers = {
  [MCP_MESSAGE_TYPES.REGISTER]: handleRegister,
  [MCP_MESSAGE_TYPES.VICTIM_MESSAGE]: handleVictimMessage,
  [MCP_MESSAGE_TYPES.POLICE_TO_VICTIM_MESSAGE]: handlePoliceToVictimMessage,
  [MCP_MESSAGE_TYPES.NEW_CASE_ADDED]: handleNewCaseAdded,
  [MCP_MESSAGE_TYPES.NEW_APPOINTMENT]: handleNewAppointment,
  [MCP_MESSAGE_TYPES.APPOINTMENT_RESPONSE]: handleAppointmentResponse,
  [MCP_MESSAGE_TYPES.VCOP_UPDATE]: handleVCOPUpdate,
  [MCP_MESSAGE_TYPES.ZOORIE_UPDATE]: handleZoorieUpdate,
  [MCP_MESSAGE_TYPES.NEW_TASK]: handleNewTask,
  [MCP_MESSAGE_TYPES.REQUEST_CASES]: handleRequestCases,
  [MCP_MESSAGE_TYPES.ADMIN_MESSAGE]: handleAdminMessage,
  [MCP_MESSAGE_TYPES.OFFICER_MESSAGE]: handleOfficerMessage,
  [MCP_MESSAGE_TYPES.TYPING_INDICATOR]: handleTypingIndicator,
  [MCP_MESSAGE_TYPES.MESSAGE_READ]: handleMessageRead
};

// Handle Socket.io connections
io.on('connection', (socket) => {
  totalConnections++;
  console.log(`Client connected: ${socket.id} (Total: ${totalConnections})`);

  // Handle user registration
  socket.on('register', (data) => {
    handleRegister(socket, data);
  });

  // Handle messages
  socket.on('message', (message) => {
    messageCount++;

    // Log message for debugging
    const logEntry = {
      timestamp: new Date().toISOString(),
      socketId: socket.id,
      userId: socket.userId || 'unknown',
      message
    };
    messageHistory.push(logEntry);
    console.log(`Message received (${messageCount}):`, JSON.stringify(logEntry));

    // Process message based on type
    const handler = messageHandlers[message.type];
    if (handler) {
      handler(socket, message);
    } else {
      console.log(`Unknown message type: ${message.type}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (socket.userId && clients[socket.userId]) {
      console.log(`User ${socket.userId} disconnected`);
      delete clients[socket.userId];
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    failedConnections++;
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// API Routes
// Root route
app.get('/', (req, res) => {
  res.send('Eskode3 MCP Server is running! Available endpoints: /api/status, /api/clients');
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
  const clientList = Object.keys(clients).map(userId => ({
    userId,
    userType: clients[userId].userType,
    connectedAt: clients[userId].connectedAt
  }));

  res.json(clientList);
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/status`);
});
