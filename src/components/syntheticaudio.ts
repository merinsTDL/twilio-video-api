import { getAudioContext } from './getAudioContext';

/* eslint-disable no-undef */

interface MediaStreamAudioDestinationNode extends AudioNode {
  stream: MediaStream;
}

export function syntheticAudio() {
  const audioContext = getAudioContext();
  const oscillator = audioContext.createOscillator();
  const dst = oscillator.connect(audioContext.createMediaStreamDestination()) as MediaStreamAudioDestinationNode;
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  const originalStop = track.stop;
  track.stop = () => {
    originalStop.call(track);
  };
  return track;
}
