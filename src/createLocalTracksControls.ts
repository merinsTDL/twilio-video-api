/* eslint-disable no-console */
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { audioBuffer } from './components/audioBuffer';
import { syntheticAudio } from './components/syntheticaudio';
import { syntheticVideo } from './components/syntheticvideo';
import { log } from './components/log';
import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { getDeviceSelectionOptions } from './getDeviceSelectionOptions';
import { IRenderedLocalTrack, renderLocalTrack } from './renderLocalTrack';
import { Room, LocalTrack, LocalAudioTrack, LocalVideoTrack, Track, CreateLocalTrackOptions } from 'twilio-video';

import jss from './jss'
import { createLabeledInput } from './components/createLabeledInput';
import { IRoomControl } from './createRoomControls';
import { createSelection } from './components/createSelection';

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
  },
  roomControlsRow: {
    'justify-content': 'center',
    'align-items': 'center',
    'width': "100%",
    'flex-direction': 'row',
    'display': 'flex',
    'margin-top': '10px',
  },
  trackChoiceSelection: {
    'font-size': 'large'
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function createLocalTracksControls({ roomControl, container, rooms, Video, localTracks }: {
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
  function manageLocalTrack({ localTrack, trackName = 'Local Track', videoDevices = [] }: {
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

  function renderStandAloneMediaStreamTrack({ msTrack, autoAttach = true }: { msTrack: MediaStreamTrack, autoAttach: boolean }) {
    const localTrack = msTrack.kind === 'video' ?
      new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: 'my-video' }) :
      new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: 'my-audio' });
    renderLocalTrack({ container: localTracksContainer, rooms: [], track: localTrack, videoDevices: [], autoAttach, autoPublish: false, onClosed: () => { } });
  }

  function getLocalTrackOptions(defaultName: string): CreateLocalTrackOptions {
    const trackConstraints = roomControl.getTrackConstraints();
    const trackOptions = trackConstraints === '' ? { logLevel: 'warn', name: defaultName } : JSON.parse(trackConstraints);
    log('Track Options:', JSON.stringify(trackOptions));
    return trackOptions
  }

  const trackSelectionDiv = createDiv(localTrackButtonsContainer, sheet.classes.roomControlsRow);

  type LocalTrackType = 'Local Video' | 'Local Audio' | 'Krisp Audio' | 'Rnnoise Audio' | 'Synthetic Video' | 'Synthetic Audio' | 'Screen Share' | 'File Audio';
  const trackChoice = createSelection({
    container: trackSelectionDiv,
    options: ['Krisp Audio', 'Rnnoise Audio', 'Local Video', 'Local Audio', 'Synthetic Video', 'Synthetic Audio', 'Screen Share', 'File Audio'],
    title: '',
    labelClasses: [],
    selectClasses: [sheet.classes.trackChoiceSelection],
    onChange: () => {
      log('click create to add: :', trackChoice.getValue());
    }
  });

  async function createTrack(trackType: LocalTrackType) {
    const thisTrackName = trackType + '-' + number++;
    try {
      const trackOptions = getLocalTrackOptions(thisTrackName);
      let localTrack: LocalAudioTrack | LocalVideoTrack;
      switch (trackType) {
        case 'Local Audio':
          localTrack = await Video.createLocalAudioTrack(trackOptions);
          break;

        case 'Local Video':
          localTrack = await Video.createLocalVideoTrack(trackOptions);
          break;

        case 'Synthetic Video':
          localTrack = new Video.LocalVideoTrack(syntheticVideo({ width: 640, height: 360, word: thisTrackName }), { logLevel: 'warn', name: thisTrackName });
          break;

        case 'Synthetic Audio':
          localTrack = new Video.LocalAudioTrack(syntheticAudio(), { logLevel: 'warn', name: thisTrackName });
          break;

        case 'File Audio':
          localTrack = new Video.LocalAudioTrack(audioBuffer(), { logLevel: 'warn', name: thisTrackName });
          break;

        case 'Krisp Audio':
          localTrack = await Video.createLocalAudioTrack({
            logLevel: 'warn',
            name: thisTrackName,
            noiseCancellationOptions: {
              vendor: 'krisp',
              sdkAssetsPath: '/krisp-audio-plugin/dist'
            }
          });
          break;

        case 'Rnnoise Audio':
          localTrack = await Video.createLocalAudioTrack({
            logLevel: 'warn',
            name: thisTrackName,
            noiseCancellationOptions: {
              vendor: 'rnnoise',
              sdkAssetsPath: '/rnnoise'
            }
          });
          break;

        case 'Screen Share':
          // @ts-ignore
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: trackOptions });
          localTrack = new Video.LocalVideoTrack(screenStream.getTracks()[0], { logLevel: 'warn', name: thisTrackName });
          break;

        default:
          throw new Error('invalid selection: ' + trackType);
      };

      manageLocalTrack({ localTrack, trackName: thisTrackName });
    } catch (ex) {
      log('Error creating track: ', ex);
    }
  }

  createButton('Create', trackSelectionDiv, async () => createTrack(trackChoice.getValue() as LocalTrackType))

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
    createTrack('Local Audio');
  }
  if (autoVideo) {
    createTrack('Local Video');
  }

  return {
    roomAdded: (room: Room) => {
      renderedTracks.forEach((renderedTrack => renderedTrack.roomAdded(room)));
    },
    roomRemoved: (room: Room) => {
      renderedTracks.forEach((renderedTrack => renderedTrack.roomRemoved(room)));
    },
    renderStandAloneMediaStreamTrack,
  };
}
