const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const skipButton = document.getElementById('skipButton');
const messages = document.getElementById('messages');

const socket = io();

let localStream;
let peerConnection;

const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Access the camera and microphone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
        socket.emit('join');
    })
    .catch(error => console.error(error));

// Handle incoming messages
socket.on('message', message => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
});

// Send message
sendMessage.addEventListener('click', () => {
    const message = messageInput.value;
    socket.emit('message', message);
    messageInput.value = '';
});

// Handle incoming call
socket.on('offer', async (offer) => {
    if (!peerConnection) {
        createPeerConnection();
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

// Handle answer
socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE candidate
socket.on('candidate', async (candidate) => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Handle skip event
skipButton.addEventListener('click', () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    socket.emit('skip');
    messages.innerHTML = '';
});

// Handle new peer connection after skip
socket.on('new-peer', async () => {
    if (!peerConnection) {
        createPeerConnection();
    }
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
});

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.addEventListener('icecandidate', event => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    });

    peerConnection.addEventListener('track', event => {
        remoteVideo.srcObject = event.streams[0];
    });

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
}
