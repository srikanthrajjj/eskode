const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const clients = {};

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('register', (data) => {
    const { userId, userType } = data;
    console.log(`Client registered: ${userId} (${userType})`);

    clients[socket.id] = { userId, userType, socket };

    io.emit('message', {
      type: 'USER_CONNECTED',
      payload: { userId, userType },
      senderId: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('message', (message) => {
    console.log('Message received:', message);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (clients[socket.id]) {
      const { userId, userType } = clients[socket.id];

      io.emit('message', {
        type: 'USER_DISCONNECTED',
        payload: { userId, userType },
        senderId: userId,
        timestamp: new Date().toISOString()
      });

      delete clients[socket.id];
    }
  });
});

app.get('/', (req, res) => {
  res.send('Socket.IO WebSocket server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
