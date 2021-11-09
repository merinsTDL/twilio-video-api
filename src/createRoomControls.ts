/* eslint-disable no-console */
import { randomParticipantName, randomRoomName } from  './randomName';
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createElement } from './components/createElement';
import { createLabeledCheckbox } from './components/createLabeledCheckbox';
import { createLabeledInput } from './components/createLabeledInput';
import { createLink } from './components/createLink';
import { createSelection } from './components/createSelection';
import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { log } from './components/log';
import { Log, LocalTrack, Room, LocalDataTrack } from 'twilio-video';

import jss from './jss'
import { createCollapsibleDiv } from './components/createCollapsibleDiv';
import { getRestCreds, REST_CREDENTIALS } from './getCreds';
import { logLevelSelector } from './logutils';

/*
You can override any of the SDP function by specifying a console override like a one below before connecting to the room:
window.sdpTransform = function (override, description, pc) {
  console.log(`overriding ${override} for ${description.type}  of length ${description.sdp.length} in peerConnection:`,  pc );
  return description;
}
*/

let overridesSet = false;
function setupLocalDescriptionOverride() {
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

// Create your style.
const style = {
  roomControls: {
    width: '300px',
    display: 'flex',
    padding: '5px',
    // border: 'solid black 1px',
    'flex-direction': 'column',
    'flex-wrap': 'wrap',
    'background-color': '#fff',
  },
  moreRoomControls: {
    display: 'flex',
    padding: '5px',
    // border: 'solid black 1px',
    'flex-direction': 'column',
    'flex-wrap': 'wrap',
    'background-color': '#fff',
  },
  roomControlsInput: {
    padding: '0.5em',
    'text-align': 'center',
  },
  roomControlsLabel: {
    'margin-top': '10px',
    'margin-right': '10px',
  },
  roomControlsButton: {
    'text-align': 'center'
  },
  joinRoomButton: {
    height: '3em',
  },
  controlOptions: {
    display: 'flex',
    'flex-flow': 'row wrap',
    'margin-top': '10px',
    'justify-content': 'space-around',
    'align-items': 'center',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

function handleSDKLogs(logger: Log.Logger) {
  let localDataTrack: LocalDataTrack|null = null;
  let localIdentity: string|null = null;
  const originalFactory = logger.methodFactory;
  logger.methodFactory = function(methodName: string, level: Log.LogLevelNumbers, loggerName: string) {
    const method = originalFactory(methodName, level, loggerName);
    return function(dateTime: Date, logLevel: string, component: string, message: string, data: any) {
      method(dateTime, logLevel, component, message, data);
      if (localDataTrack) {
        localDataTrack.send(JSON.stringify({
          localIdentity,
          dateTime,
          logLevel,
          component,
          message,
          data
        }));
      }
      // check for signaling events that previously used to be
      // emitted on (now deprecated) eventListener
      // they are fired with message = `event`, and group == `signaling`
      if (message === 'event' && data.group === 'signaling') {
        // console.log(`makarand EventListenerAPI | ${data.name}`);
      }
    };
  };

  // returns a function that allows sending logs to data channel.
  return {
    setLocalDataTrack: (dataTrack: LocalDataTrack, identity: string ) => {
      localDataTrack = dataTrack;
      localIdentity = identity;
    }
  }
}

export interface IRoomControl {
  shouldAutoAttach: () => boolean,
  shouldAutoPublish: () => boolean,
  getRoomControlsDiv: () => HTMLElement,
  getRoomCredentials: () => Promise<{ token: string, environment: string }>
};

export function createRoomControls(
  container: HTMLElement,
  Video: typeof import('twilio-video'),
  localTracks: LocalTrack[],
  roomJoined: (room: Room, logger: Log.Logger, restCreds: REST_CREDENTIALS | null) => void
): IRoomControl {
  const urlParams = new URLSearchParams(window.location.search);


  ({ innerDiv: container } = createCollapsibleDiv({ container, headerText: 'Controls', divClass: sheet.classes.roomControls }));
  createElement({ container, type: 'h3', id: 'twilioVideoVersion', innerHtml: 'Twilio-Video@' + Video.version });

  const selectionDiv = createDiv(container, sheet.classes.roomControlsLabel);
  const topologySelect = createSelection({
    id: 'topology',
    container: selectionDiv,
    options: ['group-small', 'peer-to-peer', 'group', 'go', 'large-room'],
    title: 'topology: ',
    labelClasses: [],
    onChange: () => {
      log('topology change:', topologySelect.getValue());
    }
  });

  const roomCodecsSelect = createSelection({
    id: 'roomCodecs',
    container: selectionDiv,
    options: ['default', 'VP8', 'H264', 'H264,VP8', 'VP8,H264'],
    title: ' roomCodecs: ',
    labelClasses: [],
    onChange: () => {
      log('codec change:', roomCodecsSelect.getValue());
    }
  });

  let extraConnectOptions: { value: string; };
  const envSelect = createSelection({
    id: 'env',
    container: selectionDiv,
    options: ['dev', 'stage', 'prod'],
    title: ' env: ',
    labelClasses: [],
    onChange: () => {
      const newEnv = envSelect.getValue();
      if (newEnv === 'dev') {
        // eslint-disable-next-line no-use-before-define
        const devOptions = Object.assign({}, defaultOptions, { wsServer: 'wss://us2.vss.dev.twilio.com/signaling' });
        extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify(devOptions, null, 2);
      }
      log('env change:', newEnv);
    }
  });

  const localIdentity = createLabeledInput({
    container,
    labelText: 'Identity: ',
    placeHolder: 'Enter identity or random one will be generated',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });

  const roomNameInput = createLabeledInput({
    container,
    labelText: 'Room: ',
    placeHolder: 'Enter room name or random name will be generated',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });

  //
  // TODO: besides server also allow to use token created from: 'https://www.twilio.com/console/video/project/testing-tools'
  const labelText = createLink({ container, linkText: 'ServerUrl', linkUrl: 'https://github.com/makarandp0/twilio-video-api#usage', newTab: true });
  labelText.classList.add(sheet.classes.roomControlsLabel);
  const tokenServerUrlInput = createLabeledInput({
    container,
    labelText,
    placeHolder: 'Enter server url',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });

  extraConnectOptions = createLabeledInput({
    container,
    labelText: 'ConnectOptions: ',
    placeHolder: 'connectOptions as json here',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputType: 'textarea'
  });


  const controlOptionsDiv = createDiv(container, sheet.classes.controlOptions, 'control-options');

  // container, labelText, id
  const autoPublish = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Publish', id: 'autoPublish' });
  const autoAttach = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Attach', id: 'autoAttach' });
  // const autoJoin = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Join', id: 'autoJoin' });
  const extraInfo = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'extra Info', id: 'extraInfo' });
  const sendLogs = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'send logs', id: 'sendLogs' });
  const autoRecord = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Record Participant', id: 'recordParticipant' });
  const defaultLogger = Video.Logger.getLogger('twilio-video');
  const urlLogLevel=urlParams.get('logLevel') || "DEBUG";
  if (urlLogLevel) {
    try {
      defaultLogger.setLevel(urlLogLevel.toUpperCase() as Log.LogLevelDesc);
    } catch (ex) {
      log('Error: Invalid logLevel: ', urlLogLevel);
    }
  }
  const logLevelSelect = logLevelSelector({ container: controlOptionsDiv, logger: defaultLogger });


  // process parameters.
  roomNameInput.value = urlParams.get('room') || randomRoomName();
  localIdentity.value = urlParams.get('identity') || randomParticipantName(); // randomName();
  tokenServerUrlInput.value = urlParams.get('server') || 'http://localhost:3002';

  // for working with dev env use:
  // const defaultOptions = { wsServer: "wss://us2.vss.dev.twilio.com/signaling" };
  // for simulcast use:
  // { preferredVideoCodecs: [ { codec: "VP8", "simulcast": true }] }
  // const defaultOptions = { networkQuality: { local: 3, remote: 0 } };
  // const defaultOptions = {
  //   "preferredVideoCodecs": [{"codec":"H264"}],
  //   "iceTransportPolicy" : "relay"
  // };
  const defaultOptions = {
    networkQuality: { local: 1, remote: 0 },
    dominantSpeaker: true,
    preferredVideoCodecs: 'auto',
    // preferredAudioCodecs: [{ codec: "opus", dtx: true }],
    // preferredAudioCodecs: [],
    bandwidthProfile: {
      video: {
        clientTrackSwitchOffControl: 'manual',
        contentPreferencesMode: 'manual',
      }
    }
  };

  extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify(defaultOptions, null, 4);
  // autoJoin.checked = urlParams.has('room') && urlParams.has('autoJoin');
  autoAttach.checked = getBooleanUrlParam('autoAttach', true);
  autoPublish.checked = getBooleanUrlParam('autoPublish', true);
  autoRecord.checked = getBooleanUrlParam('record', false);
  extraInfo.checked = getBooleanUrlParam('extraInfo', false);
  sendLogs.checked = getBooleanUrlParam('sendLogs', false);
  topologySelect.setValue(urlParams.get('topology') || 'group-small');
  roomCodecsSelect.setValue(urlParams.get('roomCodecs') || 'default');
  envSelect.setValue(urlParams.get('env') || 'prod');

  async function getRoomCredentials(): Promise<{token: string, environment: string}> {
    const identity = localIdentity.value || randomParticipantName(); // randomName();
    let tokenServerUrl = tokenServerUrlInput.value;
    const environment = envSelect.getValue();
    const roomName = roomNameInput.value;
    const recordParticipantsOnConnect = autoRecord.checked ? 'true': 'false';

    let url = new URL(tokenServerUrl + '/token');
    let maxParticipants = urlParams.get('maxParticipants') || '';
    let topology = topologySelect.getValue();
    if (topology === 'large-room') {
      maxParticipants = maxParticipants || "51"; // large-room is created when participants are 51+
      topology = 'group';
    }



    let roomCodecs = roomCodecsSelect.getValue();
    let videoCodecs = roomCodecs === 'default' ? '' : JSON.stringify(roomCodecs.split(','));

    const tokenOptions = { environment, topology, roomName, identity, recordParticipantsOnConnect, maxParticipants, videoCodecs };
    console.log('Getting Token For: ', tokenOptions);
    url.search = (new URLSearchParams(tokenOptions)).toString();
    try {
      const response = await fetch(url.toString());
      if (response.ok) {
        const tokenResponse = await response.json();
        return { token: tokenResponse.token,  environment };
      }
      throw new Error(`Failed to obtain token from ${url}, Status: ${response.status}`);
    } catch (ex) {
      throw new Error(`Error fetching token ${url}, ${ex.message}`);
    }
  }

  async function joinRoom(token: string, restCreds: REST_CREDENTIALS | null) {
    const roomName = roomNameInput.value;
    if (!roomName) {
      // eslint-disable-next-line no-alert
      alert('Please enter a room name.');
      return;
    }

    let additionalConnectOptions = {};
    if (extraConnectOptions.value !== '') {
      try {
        additionalConnectOptions = JSON.parse(extraConnectOptions.value);
      } catch (e) {
        console.warn('failed to parse additional connect options.', e);
        return;
      }
    }


    // Local track logs are always connected on twilio-video logger
    // so use the same logger when we want to send logs.
    const loggerName = sendLogs.checked ? 'twilio-video' : `[${localIdentity.value}]:` ;
    const logger = Video.Logger.getLogger(loggerName);
    logger.setLevel(defaultLogger.getLevel());

    const publishLogsAsData = sendLogs.checked;

    const logProcessor = handleSDKLogs(logger);
    const connectOptions = Object.assign({
      loggerName,
      tracks: autoPublish.checked ? localTracks : [],
      name: roomName,
      environment: envSelect.getValue()
    }, additionalConnectOptions);
    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    log(`Joining room ${roomName} with ${JSON.stringify(connectOptions, null, 2)} ${autoPublish.checked ? 'with' : 'without'} ${localTracks.length} localTracks`);

    try {
      const room = await Video.connect(token, connectOptions);
      roomJoined(room, logger, restCreds);
      localIdentity.value = randomParticipantName(); // randomName();
      if (publishLogsAsData) {
        const localDataTrack = new Video.LocalDataTrack();
        await room.localParticipant.publishTrack(localDataTrack);
        logProcessor.setLocalDataTrack(localDataTrack, loggerName);
      }
    } catch (error) {
      log('Could not connect to Twilio: ' + error.message);
    }
  }

  // eslint-disable-next-line consistent-return
  const btnJoin = createButton('Join', container, async () => {
    setupLocalDescriptionOverride();
    try {
      const token = (await getRoomCredentials()).token;
      let restCreds: REST_CREDENTIALS | null =  null;
      if (extraInfo.checked) {
        try {
          restCreds = await getRestCreds(envSelect.getValue(), tokenServerUrlInput.value);
        } catch (restError) {
          log('failed to get rest credentials:', restError);
        }
      }
      return joinRoom(token, restCreds);
    } catch (ex) {
      log('Failed: ', ex);
    }
  });
  btnJoin.btn.classList.add(sheet.classes.joinRoomButton);

  if (urlParams.has('autoJoin')) {
    btnJoin.click();
  }

  return {
    shouldAutoAttach: () => autoAttach.checked,
    shouldAutoPublish: () => autoPublish.checked,
    getRoomControlsDiv: () => container,
    getRoomCredentials,
  };
}


