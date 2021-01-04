/* eslint-disable no-console */
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { syntheticAudio } from './components/syntheticaudio';
import { syntheticVideo }  from './components/syntheticvideo';

import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { getDeviceSelectionOptions } from './getDeviceSelectionOptions';
import { renderLocalTrack } from './renderLocalTrack';
import { Room, LocalTrack, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';

import jss from './jss'

// Create your style.
const style = {
  localTracksDiv: {
    width: 'inherit',
  },
  trackRenders: {
    display: 'flex',
    'flex-wrap': 'wrap',
  },
  trackButtonsContainer: {
    'text-align': 'left',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createLocalTracksControls({ container, rooms, Video, localTracks, shouldAutoAttach, shouldAutoPublish } : {
  container: HTMLElement,
  rooms: Room[],
  Video: typeof import('twilio-video'),
  localTracks: LocalTrack[],
  shouldAutoAttach: () => boolean,
  shouldAutoPublish: () => boolean
}) {
  container = createDiv(container, sheet.classes.localTracksDiv);

  let number = 0;
  const autoAudio = getBooleanUrlParam('autoAudio', false);
  const autoVideo = getBooleanUrlParam('autoVideo', false);

  const localTrackButtonsContainer = createDiv(container, sheet.classes.trackButtonsContainer);
  const localTracksContainer = createDiv(container, sheet.classes.trackRenders);

  const renderedTracks = new Map();
  function renderLocalTrack2(track: LocalAudioTrack | LocalVideoTrack, videoDevices: MediaDeviceInfo[] = []) {
    localTracks.push(track);
    renderedTracks.set(track, renderLocalTrack({
      container: localTracksContainer,
      rooms,
      track,
      videoDevices,
      autoAttach: shouldAutoAttach(),
      autoPublish: shouldAutoPublish(),
      onClosed: () => {
        const index = localTracks.indexOf(track);
        if (index > -1) {
          localTracks.splice(index, 1);
        }
        renderedTracks.delete(track);
      }
    }));
  }

  // eslint-disable-next-line no-unused-vars
  const btnPreviewAudio = createButton('+ Local Audio', localTrackButtonsContainer, async () => {
    const thisTrackName = 'mic-' + number++;
    const localTrack = await Video.createLocalAudioTrack({ logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  // eslint-disable-next-line no-unused-vars
  const btnSyntheticAudio = createButton('+ Synthetic Audio', localTrackButtonsContainer, async () => {
    const thisTrackName = 'Audio-' + number++;
    const msTrack = await syntheticAudio();
    const localTrack = new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  // eslint-disable-next-line no-unused-vars
  const btnPreviewVideo = createButton('+ Local Video', localTrackButtonsContainer, async () => {
    const thisTrackName = 'camera-' + number++;
    const localTrack = await Video.createLocalVideoTrack({ logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });


  const btnSyntheticVideo = createButton('+ Synthetic Video', localTrackButtonsContainer, async () => {
    const thisTrackName = 'Video-' + number++;
    const msTrack = await syntheticVideo({ width: 300, height: 150, word: thisTrackName });
    const localTrack = new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  // eslint-disable-next-line no-unused-vars
  const enumerateBtn = createButton('Enumerate Cameras', localTrackButtonsContainer, async () => {
    enumerateBtn.disable();
    const devices = await getDeviceSelectionOptions();
    devices.videoinput.forEach((device, i, videoDevices) => {
      createButton(device.label, localTrackButtonsContainer, async () => {
        const videoConstraints = {
          deviceId: { exact: device.deviceId },
          // height: 480, width: 640, frameRate: 24
        };
        const thisTrackName = 'camera-' + number++;
        const localTrack = await Video.createLocalVideoTrack({ logLevel: 'warn', name: thisTrackName, ...videoConstraints });

        renderLocalTrack2(localTrack, videoDevices);
      });
    });
  });

  if (autoAudio) {
    btnPreviewAudio.click();
  }
  if (autoVideo) {
    btnPreviewVideo.click();
  }

  return {
    roomAdded: (room: Room)  => {
      Array.from(renderedTracks.values()).forEach(renderedTrack => renderedTrack.roomAdded(room));
    },
    roomRemoved: (room: Room) => {
      Array.from(renderedTracks.values()).forEach(renderedTrack => renderedTrack.roomRemoved(room));
    },
  };
}
