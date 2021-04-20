/* eslint-disable no-console */
import { randomName, randomParticipantName, randomRoomName } from  './randomName';
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createElement } from './components/createElement';
import { createLabeledCheckbox } from './components/createLabeledCheckbox';
import { createLabeledInput } from './components/createLabeledInput';
import { createLink } from './components/createLink';
import { createSelection } from './components/createSelection';
import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { log } from './components/log';
import { Log, LocalTrack, Room, RemoteParticipant, RemoteTrack, RemoteTrackPublication } from 'twilio-video';

import jss from './jss'
import { createCollapsibleDiv } from './components/createCollapsibleDiv';
import { getRestCreds, REST_CREDENTIALS } from './getCreds';

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
    border: 'solid black 1px',
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
  controlOptions: {
    display: 'flex',
    'flex-flow': 'row wrap',
    'margin-top': '10px',
    'justify-content': 'center',
    'align-items': 'center',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

function handleSDKLogs(logger: Log.Logger) {
  const originalFactory = logger.methodFactory;
  logger.methodFactory = function(methodName: string, level: Log.LogLevelNumbers, loggerName: string) {
    const method = originalFactory(methodName, level, loggerName);
    return function(dateTime: Date, logLevel: string, component: string, message: string, data: any) {
      method(dateTime, logLevel, component, message, data);
      // check for signaling events that previously used to be
      // emitted on (now deprecated) eventListener
      // they are fired with message = `event`, and group == `signaling`
      if (message === 'event' && data.group === 'signaling') {
        // console.log(`makarand EventListenerAPI | ${data.name}`);
      }
    };
  };
}

export interface IRoomControl {
  shouldAutoAttach: () => boolean,
  shouldAutoPublish: () => boolean,
  getRoomControlsDiv: () => HTMLDivElement
};

export function createRoomControls(
  container: HTMLElement,
  Video: typeof import('twilio-video'),
  localTracks: LocalTrack[],
  roomJoined: (room: Room, logger: Log.Logger, restCreds: REST_CREDENTIALS | null) => void
): IRoomControl {
  const urlParams = new URLSearchParams(window.location.search);

  const { innerDiv, outerDiv } = createCollapsibleDiv({ container, headerText: 'Controls', divClass: sheet.classes.roomControls });

  const twilioVideoVersion = createElement({ container: innerDiv, type: 'h3', id: 'twilioVideoVersion' });
  twilioVideoVersion.innerHTML = 'Twilio-Video@' + Video.version;

  const topologySelect = createSelection({
    id: 'topology',
    container: innerDiv,
    options: ['group-small', 'peer-to-peer', 'group', 'go'],
    title: 'topology',
    labelClasses: [sheet.classes.roomControlsLabel],
    onChange: () => log('topology change:', topologySelect.getValue())
  });

  let extraConnectOptions: { value: string; };
  const envSelect = createSelection({
    id: 'env',
    container: innerDiv,
    options: ['dev', 'stage', 'prod'],
    title: 'env',
    labelClasses: [sheet.classes.roomControlsLabel],
    onChange: () => {
      const newEnv = envSelect.getValue();
      if (newEnv === 'dev') {
        // eslint-disable-next-line no-use-before-define
        const devOptions = Object.assign({}, defaultOptions, { wsServer: 'wss://us2.vss.dev.twilio.com/signaling' });
        extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify(devOptions);
      }
      log('env change:', newEnv);
    }
  });

  //
  // TODO: besides server also allow to use token created from: 'https://www.twilio.com/console/video/project/testing-tools'
  const labelText = createLink({ container: innerDiv, linkText: 'ServerUrl', linkUrl: 'https://github.com/makarandp0/twilio-video-api#usage', newTab: true });
  labelText.classList.add(sheet.classes.roomControlsLabel);
  const tokenServerUrlInput = createLabeledInput({
    container: innerDiv,
    labelText,
    placeHolder: 'Enter server url',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });

  const localIdentity = createLabeledInput({
    container: innerDiv,
    labelText: 'Identity: ',
    placeHolder: 'Enter identity or random one will be generated',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });

  const roomNameInput = createLabeledInput({
    container: innerDiv,
    labelText: 'Room: ',
    placeHolder: 'Enter room name or random name will be generated',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });

  extraConnectOptions = createLabeledInput({
    container: innerDiv,
    labelText: 'ConnectOptions: ',
    placeHolder: 'connectOptions as json here',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputType: 'textarea'
  });

  const maxParticipantsInput = createLabeledInput({
    container: innerDiv,
    labelText: 'MaxParticipants: ',
    placeHolder: 'optional (51+ makes large room)]',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: [sheet.classes.roomControlsInput]
  });


  const controlOptionsDiv = createDiv(innerDiv, sheet.classes.controlOptions, 'control-options');

  // container, labelText, id
  const autoPublish = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Publish', id: 'autoPublish' });
  const autoAttach = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Attach', id: 'autoAttach' });
  const autoJoin = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Join', id: 'autoJoin' });
  const autoRecord = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Record Participant', id: 'recordParticipant' });
  const extraInfo = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'extra Info', id: 'extraInfo' });

  // process parameters.
  roomNameInput.value = urlParams.get('room') || randomRoomName();
  localIdentity.value = urlParams.get('identity') || randomParticipantName(); // randomName();
  tokenServerUrlInput.value = urlParams.get('server') || 'http://localhost:3000';
  maxParticipantsInput.value = urlParams.get('maxParticipants') || '';

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
    preferredVideoCodecs: [ { codec: "VP8", "simulcast": true }],
    bandwidthProfile: {
      video: {
        subscribedTrackSwitchOffMode: 'manual',
        contentPreferencesMode: 'manual',
      }
    }
  };

  extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify(defaultOptions);
  autoJoin.checked = urlParams.has('room') && urlParams.has('autoJoin');
  autoAttach.checked = getBooleanUrlParam('autoAttach', true);
  autoPublish.checked = getBooleanUrlParam('autoPublish', true);
  autoRecord.checked = getBooleanUrlParam('record', false);
  extraInfo.checked = getBooleanUrlParam('extraInfo', false);
  topologySelect.setValue(urlParams.get('topology') || 'group-small');
  envSelect.setValue(urlParams.get('env') || 'prod');

  async function getRoomCredentials(): Promise<{token: string}> {
    const identity = localIdentity.value || randomParticipantName(); // randomName();
    let tokenServerUrl = tokenServerUrlInput.value;
    const topology = topologySelect.getValue();
    const environment = envSelect.getValue();
    const roomName = roomNameInput.value;
    const recordParticipantsOnConnect = autoRecord.checked ? 'true': 'false';

    let url = new URL(tokenServerUrl + '/token');
    let maxParticipants = maxParticipantsInput.value;

    const tokenOptions = { environment, topology, roomName, identity, recordParticipantsOnConnect, maxParticipants };
    console.log('Getting Token For: ', tokenOptions);
    url.search = (new URLSearchParams(tokenOptions)).toString();
    try {
      const response = await fetch(url.toString());
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Failed to obtain token from ${url}, Status: ${response.status}`);
    } catch (ex) {
      throw new Error(`Error fetching token ${url}, ${ex.message}`);
    }
  }

  function joinRoom(token: string, restCreds: REST_CREDENTIALS | null) {
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

    log(`Joining room ${roomName} ${autoPublish.checked ? 'with' : 'without'} ${localTracks.length} localTracks`);
    const loggerName = `[${localIdentity.value}]:`;
    const logger = Video.Logger.getLogger(loggerName);
    handleSDKLogs(logger);

    const connectOptions = Object.assign({
      loggerName,
      tracks: autoPublish.checked ? localTracks : [],
      name: roomName,
      environment: envSelect.getValue()
    }, additionalConnectOptions);
    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    log(`Joining room ${roomName} with ${JSON.stringify(connectOptions, null, 2)}`);

    Video.connect(token, connectOptions)
      .then(room => {
        roomJoined(room, logger, restCreds);
        // get new local identity for next join.
        localIdentity.value = randomParticipantName(); // randomName();
      }).catch(error => {
        log('Could not connect to Twilio: ' + error.message);
      });
  }

  // eslint-disable-next-line consistent-return
  const btnJoin = createButton('Join', innerDiv, async () => {
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

  if (autoJoin.checked) {
    btnJoin.click();
  }

  // @ts-ignore
  const runPreflight =  Video.runPreflight;

  // @ts-ignore
  const testPreflight = Video.testPreflight;
  if (typeof runPreflight === 'function' || typeof testPreflight === 'function') {
    let preflightTest: any = null;
    createButton('prepare preflight', innerDiv, async () => {
      localIdentity.value = 'Alice';
      const aliceToken = (await getRoomCredentials()).token;
      localIdentity.value = 'Bob';
      const bobToken = (await getRoomCredentials()).token;
      createButton('runPreflight', innerDiv, async () => {
        const logger = Video.Logger.getLogger('twilio-video');
        logger.setLevel('DEBUG');
        console.log('starting runPreflight');
        const environment = envSelect.getValue();

        // preflightTest = runPreflight(aliceToken, { duration: 100000, environment, preferredVideoCodecs: [{ codec:"VP8", simulcast: true }]});
        // preflightTest = testPreflight(aliceToken, bobToken, { duration: 10000, environment });
        if (runPreflight) {
          preflightTest = runPreflight(aliceToken, { duration: 100000, environment });
        } else {
          preflightTest = testPreflight(aliceToken, { duration: 100000, environment });
        }
        const deferred: { reject?: (e: Error) => void, resolve?: (report: any) => void, promise?: Promise<any> } = {};
        deferred.promise = new Promise((resolve, reject) => {
          deferred.resolve = resolve;
          deferred.reject = reject;
        });

        preflightTest.on('debug', (room1: Room, room2: Room) => {
          console.log('preflight debug:', room1, room2);
          roomJoined(room2, logger,  null);
        });

        preflightTest.on('progress', (progress: string)  => {
          console.log('preflight progress:', progress);
        });

        preflightTest.on('failed', (error: Error) => {
          console.error('preflight error:', error);
          deferred.reject && deferred.reject(error);
        });

        preflightTest.on('completed', (report: any) => {
          console.log('preflight completed:', JSON.stringify(report, null, 4));
          deferred.resolve && deferred.resolve(report);
        });

        await deferred.promise;
      });
    });
  }

  return {
    shouldAutoAttach: () => autoAttach.checked,
    shouldAutoPublish: () => autoPublish.checked,
    getRoomControlsDiv: () => innerDiv
  };
}

