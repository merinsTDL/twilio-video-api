import { getAudioContext } from './getAudioContext';

/* eslint-disable no-undef */

interface MediaStreamAudioDestinationNode extends AudioNode {
  stream: MediaStream;
}

export function audioBuffer() {
  const URL = 'https://api.twilio.com/cowbell.mp3';

  const audioContext = getAudioContext();
  const source = audioContext.createBufferSource();
  source.loop = true;

  fetch(URL)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      source.buffer = audioBuffer;
    });

  const dst = source.connect(audioContext.createMediaStreamDestination()) as MediaStreamAudioDestinationNode;
  source.start();
  const track = dst.stream.getAudioTracks()[0];
  const originalStop = track.stop;
  track.stop = () => {
    originalStop.call(track);
  };
  return track;
}

// const ctx = new AudioContext();
// let audio;
// fetch("./sounds/phantom-cities.mp3");
// 	.then(data => data.arrayBuffer())
// 	.then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
// 	.then(decodedAudio => {
// 		audio = decodedAudio;
// 	})