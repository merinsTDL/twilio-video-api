let overridesSet = false;

/*
You can override any of the SDP function by specifying a console override like a one below before connecting to the room:
window.sdpTransform = function (override, description, pc) {
  console.log(`overriding ${override} for ${description.type}  of length ${description.sdp.length} in peerConnection:`,  pc );
  return description;
}
*/
export function setupLocalDescriptionOverride() {
  // @ts-ignore
  const transform = window.sdpTransform;
  if (!overridesSet && typeof transform === 'function') {
    overridesSet = true;
    const origSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
    const origSetRemoteDescription = RTCPeerConnection.prototype.setRemoteDescription;
    const origCreateOffer = RTCPeerConnection.prototype.createOffer;
    const origCreateAnswer = RTCPeerConnection.prototype.createAnswer;
    RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription(description) {
      return origSetLocalDescription.call(this, transform('setLocalDescription', description, this));
    };
    RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(description) {
      return origSetRemoteDescription.call(this, transform('setRemoteDescription', description, this));
    };
    RTCPeerConnection.prototype.createOffer = function createOffer(options) {
      return origCreateOffer.call(this, options).then((offer: RTCSessionDescription) => {
        return transform('createOffer', offer, this);
      });
    };
    RTCPeerConnection.prototype.createAnswer = function createAnswer(options) {
      return origCreateAnswer.call(this, options).then((answer: RTCSessionDescription) => {
        return transform('createAnswer', answer, this);
      });
    };
  }
}
