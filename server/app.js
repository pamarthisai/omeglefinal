const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const peers = {};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    if (!peers[roomId]) {
      peers[roomId] = [];
    }
    peers[roomId].push(socket.id);

    const otherUsers = peers[roomId].filter(id => id !== socket.id);
    socket.emit('all-users', otherUsers);
  });

  socket.on('offer', payload => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', payload => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', incoming => {
    io.to(incoming.target).emit('ice-candidate', incoming.candidate);
  });

  socket.on('disconnect', () => {
    for (const roomId in peers) {
      peers[roomId] = peers[roomId].filter(id => id !== socket.id);
      if (peers[roomId].length === 0) {
        delete peers[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
