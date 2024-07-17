const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Define a route handler for the default home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // Additional socket.io event handling can go here
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

// Set the port to the environment variable PORT or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
