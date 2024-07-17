// WebRTC polyfills for cross-browser compatibility
if (!window.RTCPeerConnection) {
  window.RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
}
if (!window.RTCSessionDescription) {
  window.RTCSessionDescription = window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
}
if (!window.RTCIceCandidate) {
  window.RTCIceCandidate = window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
}
