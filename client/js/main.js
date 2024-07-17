const socket = io();
let localStream;
let remoteStream;
let peerConnection;
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  localStream = stream;
  myVideo.srcObject = stream;
  myVideo.addEventListener('loadedmetadata', () => {
    myVideo.play();
  });
  videoGrid.append(myVideo);
});

socket.on('all-users', users => {
  users.forEach(userId => {
    callUser(userId);
  });
});

socket.on('offer', handleReceiveCall);
socket.on('answer', handleAnswer);
socket.on('ice-candidate', handleNewICECandidateMsg);

const handleReceiveCall = async (incoming) => {
  await createPeerConnection();
  peerConnection.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
  socket.emit('answer', { target: incoming.caller, sdp: peerConnection.localDescription });
};

const handleAnswer = (message) => {
  const desc = new RTCSessionDescription(message.sdp);
  peerConnection.setRemoteDescription(desc).catch(e => console.log(e));
};

const handleNewICECandidateMsg = (incoming) => {
  const candidate = new RTCIceCandidate(incoming);
  peerConnection.addIceCandidate(candidate).catch(e => console.log(e));
};

const callUser = async (userId) => {
  await createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
  socket.emit('offer', { target: userId, sdp: peerConnection.localDescription });
};

const createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.ontrack = handleTrackEvent;
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
};

const handleICECandidateEvent = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', { target: peerConnection.remoteDescription, candidate: event.candidate });
  }
};

const handleTrackEvent = (event) => {
  remoteStream = event.streams[0];
  const remoteVideo = document.createElement('video');
  remoteVideo.srcObject = remoteStream;
  remoteVideo.addEventListener('loadedmetadata', () => {
    remoteVideo.play();
  });
  videoGrid.append(remoteVideo);
};

socket.emit('join-room', ROOM_ID);
