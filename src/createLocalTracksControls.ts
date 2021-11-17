/* eslint-disable no-console */
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { syntheticAudio } from './components/syntheticaudio';
import { syntheticVideo }  from './components/syntheticvideo';
import { log } from './components/log';
import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { getDeviceSelectionOptions } from './getDeviceSelectionOptions';
import { IRenderedLocalTrack, renderLocalTrack } from './renderLocalTrack';
import { Room, LocalTrack, LocalAudioTrack, LocalVideoTrack, Track, CreateLocalTrackOptions } from 'twilio-video';

import jss from './jss'
import { createLabeledInput } from './components/createLabeledInput';
import { IRoomControl } from './createRoomControls';

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

export function createLocalTracksControls({ roomControl, container, rooms, Video, localTracks } : {
  roomControl: IRoomControl
  container: HTMLElement, // parent for tracks.
  rooms: Room[],
  Video: typeof import('twilio-video'),
  localTracks: LocalTrack[]
}) {
  let number = 0;
  const autoAudio = getBooleanUrlParam('autoAudio', false);
  const autoVideo = getBooleanUrlParam('autoVideo', false);

  const localTrackButtonsContainer = createDiv(roomControl.getRoomControlsDiv(), sheet.classes.trackButtonsContainer);
  const localTracksContainer = createDiv(container, sheet.classes.trackRenders);

  const renderedTracks = new Map<LocalTrack, IRenderedLocalTrack>();
  function manageLocalTrack({ localTrack, trackName = 'Local Track', videoDevices = []} : {
    trackName?: string,
    localTrack: LocalAudioTrack | LocalVideoTrack,
    videoDevices?: MediaDeviceInfo[]
  }) {
    log('Track settings: ', localTrack.mediaStreamTrack.getSettings && localTrack.mediaStreamTrack.getSettings());
    log('Track capabilities: ', localTrack.mediaStreamTrack.getCapabilities && localTrack.mediaStreamTrack.getCapabilities());
    localTracks.push(localTrack);
    renderedTracks.set(localTrack, renderLocalTrack({
      container: localTracksContainer,
      rooms,
      track: localTrack,
      videoDevices,
      trackName,
      autoAttach: roomControl.shouldAutoAttach(),
      autoPublish: roomControl.shouldAutoPublish(),
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
      new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: 'my-video' }) :
      new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: 'my-audio' });
    renderLocalTrack({ container: localTracksContainer, rooms: [], track: localTrack, videoDevices: [], autoAttach, autoPublish: false, onClosed: () => { } });
  }

  function getLocalTrackOptions(defaultName: string) : CreateLocalTrackOptions {
    const trackConstraints = roomControl.getTrackConstraints();
    const  trackOptions = trackConstraints === '' ? { logLevel: 'warn', name: defaultName } : JSON.parse(trackConstraints);
    log('Track Options:', JSON.stringify(trackOptions));
    return trackOptions
  }

  const btnPreviewAudio = createButton('+ Local Audio', localTrackButtonsContainer, async () => {
    const thisTrackName = 'mic-' + number++;
    const trackOptions = getLocalTrackOptions(thisTrackName);
    const localTrack = await Video.createLocalAudioTrack(trackOptions);
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
    const trackOptions = getLocalTrackOptions(thisTrackName);
    const localTrack = await Video.createLocalVideoTrack(trackOptions);
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
      const { deviceId, label } = device;
      console.log({ deviceId, label });
      log({ deviceId, label });
      console.log({ deviceId, label });
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
