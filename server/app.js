const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('client'));

const users = {};

io.on('connection', socket => {
    console.log('A user connected');

    socket.on('join', () => {
        users[socket.id] = socket;
        findPeerForSocket(socket);
    });

    socket.on('message', message => {
        const peerSocket = users[socket.peerId];
        if (peerSocket) {
            peerSocket.emit('message', message);
        }
    });

    socket.on('offer', offer => {
        const peerSocket = users[socket.peerId];
        if (peerSocket) {
            peerSocket.emit('offer', offer);
        }
    });

    socket.on('answer', answer => {
        const peerSocket = users[socket.peerId];
        if (peerSocket) {
            peerSocket.emit('answer', answer);
        }
    });

    socket.on('candidate', candidate => {
        const peerSocket = users[socket.peerId];
        if (peerSocket) {
            peerSocket.emit('candidate', candidate);
        }
    });

    socket.on('skip', () => {
        const peerSocket = users[socket.peerId];
        if (peerSocket) {
            peerSocket.peerId = null;
            peerSocket.emit('new-peer');
            findPeerForSocket(peerSocket);
        }
        socket.peerId = null;
        socket.emit('new-peer');
        findPeerForSocket(socket);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        const peerSocket = users[socket.peerId];
        if (peerSocket) {
            peerSocket.peerId = null;
            peerSocket.emit('message', 'A user has left the chat');
        }
        delete users[socket.id];
    });
});

function findPeerForSocket(socket) {
    for (let id in users) {
        if (users[id].peerId === null && users[id].id !== socket.id) {
            users[id].peerId = socket.id;
            socket.peerId = users[id].id;
            users[id].emit('new-peer');
            socket.emit('new-peer');
            return;
        }
    }
    socket.peerId = null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
