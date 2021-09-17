/* eslint-disable no-console */
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { syntheticAudio } from './components/syntheticaudio';
import { syntheticVideo }  from './components/syntheticvideo';

import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { getDeviceSelectionOptions } from './getDeviceSelectionOptions';
import { IRenderedLocalTrack, renderLocalTrack } from './renderLocalTrack';
import { Room, LocalTrack, LocalAudioTrack, LocalVideoTrack, Track } from 'twilio-video';

import jss from './jss'

type localTrack = LocalAudioTrack | LocalVideoTrack;

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
    'display': 'flex',
    'flex-flow': 'row wrap'
  }

}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createLocalTracksControls({ buttonContainer, container, rooms, Video, localTracks, shouldAutoAttach, shouldAutoPublish } : {
  buttonContainer: HTMLElement, // parent for control buttons
  container: HTMLElement, // parent for tracks.
  rooms: Room[],
  Video: typeof import('twilio-video'),
  localTracks: LocalTrack[],
  shouldAutoAttach: () => boolean,
  shouldAutoPublish: () => boolean
}) {
  let number = 0;
  const autoAudio = getBooleanUrlParam('autoAudio', false);
  const autoVideo = getBooleanUrlParam('autoVideo', false);

  const localTrackButtonsContainer = createDiv(buttonContainer, sheet.classes.trackButtonsContainer);
  const localTracksContainer = createDiv(container, sheet.classes.trackRenders);

  const renderedTracks = new Map<LocalTrack, IRenderedLocalTrack>();
  function manageLocalTrack({ localTrack, trackName = 'Local Track', videoDevices = []} : {
    trackName?: string,
    localTrack: LocalAudioTrack | LocalVideoTrack,
    videoDevices?: MediaDeviceInfo[]
  }) {
    console.log('Track settings: ', localTrack.mediaStreamTrack.getSettings && localTrack.mediaStreamTrack.getSettings());
    console.log('Track capabilities: ', localTrack.mediaStreamTrack.getCapabilities && localTrack.mediaStreamTrack.getCapabilities());
    localTracks.push(localTrack);
    renderedTracks.set(localTrack, renderLocalTrack({
      container: localTracksContainer,
      rooms,
      track: localTrack,
      videoDevices,
      trackName,
      autoAttach: shouldAutoAttach(),
      autoPublish: shouldAutoPublish(),
      onClosed: () => {
        const index = localTracks.indexOf(localTrack);
        if (index > -1) {
          localTracks.splice(index, 1);
        }
        renderedTracks.delete(localTrack);
      }
    }));
  }

  function renderStandAloneMediaStreamTrack({ msTrack, autoAttach = true } : { msTrack: MediaStreamTrack, autoAttach: boolean }) {
    const localTrack = msTrack.kind === 'video' ?
      new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: 'my-video', workaroundWebKitBug1208516: false }) :
      new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: 'my-audio', workaroundWebKitBug1208516: false });
    renderLocalTrack({ container: localTracksContainer, rooms: [], track: localTrack, videoDevices: [], autoAttach, autoPublish: false, onClosed: () => { } });
  }

  const btnPreviewAudio = createButton('+ Local Audio', localTrackButtonsContainer, async () => {
    const thisTrackName = 'mic-' + number++;
    const localTrack = await Video.createLocalAudioTrack({ logLevel: 'warn', name: thisTrackName });
    manageLocalTrack({ localTrack, trackName: thisTrackName });
  });

  // eslint-disable-next-line no-unused-vars
  const btnSyntheticAudio = createButton('+ Synthetic Audio', localTrackButtonsContainer, async () => {
    const thisTrackName = 'SynAudio-' + number++;
    const msTrack = await syntheticAudio();
    const localTrack = new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    manageLocalTrack({ localTrack, trackName: thisTrackName});
  });

  // eslint-disable-next-line no-unused-vars
  const btnPreviewVideo = createButton('+ Local Video', localTrackButtonsContainer, async () => {
    const thisTrackName = 'camera-' + number++;
    const localTrack = await Video.createLocalVideoTrack({ width: 1280, height: 720, logLevel: 'warn', name: thisTrackName });
    manageLocalTrack({ localTrack, trackName: thisTrackName });
  });


  const btnSyntheticVideo = createButton('+ Synthetic Video', localTrackButtonsContainer, async () => {
    const thisTrackName = 'SynVideo-' + number++;
    const msTrack = await syntheticVideo({ width: 640, height: 360, word: thisTrackName });
    const localTrack = new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    manageLocalTrack({ localTrack, trackName: thisTrackName });
  });

  const btnScreenShare = createButton('+ Screen Share', localTrackButtonsContainer, async () => {
    const thisTrackName = 'screen-' + number++;
    // @ts-ignore
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1920, height: 1080, frameRate: 15 }
    });
    const localTrack = new Video.LocalVideoTrack(screenStream.getTracks()[0], { logLevel: 'warn', name: thisTrackName });
    manageLocalTrack({ localTrack, trackName: thisTrackName });
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
        const thisTrackName = 'camera-' + device.label + number++;
        const localTrack = await Video.createLocalVideoTrack({ logLevel: 'warn', name: thisTrackName, ...videoConstraints });

        manageLocalTrack({ localTrack, videoDevices, trackName: thisTrackName });
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
      renderedTracks.forEach((renderedTrack => renderedTrack.roomAdded(room)));
    },
    roomRemoved: (room: Room) => {
      renderedTracks.forEach((renderedTrack => renderedTrack.roomRemoved(room)));
    },
    renderStandAloneMediaStreamTrack,
  };
}
