/* eslint-disable no-console */
import { randomName, randomRoomName } from  './randomName';
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createElement } from './components/createElement';
import { createLabeledCheckbox } from './components/createLabeledCheckbox';
import { createLabeledInput } from './components/createLabeledInput';
import { createLink } from './components/createLink';
import { createSelection } from './components/createSelection';
import { getBooleanUrlParam } from './components/getBooleanUrlParam';
import { log as log2 } from './components/log';
import { Room, LocalTrack } from 'twilio-video';
import log from 'logLevel';

import jss from './jss'

// Create your style.
const style = {
  roomControls: {
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
    'margin-top': '10px',
    'justify-content': 'center',
    'align-items': 'center',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

function handleSDKLogs(logger: log.Logger) {
  const originalFactory = logger.methodFactory;
  logger.methodFactory = function(methodName: string, level: log.LogLevelNumbers, loggerName: string) {
    const method = originalFactory(methodName, level, loggerName);
    return function(dateTime: Date, logLevel: string, component: string, message: string, data: any) {
      method(dateTime, logLevel, component, message, data);
      // check for signaling events that previously used to be
      // emitted on (now deprecated) eventListener
      // they are fired with message = `event`, and group == `signaling`
      if (message === 'event' && data.group === 'signaling') {
        console.log(`makarand EventListenerAPI | ${data.name}`);
      }
    };
  };
}

export interface IRoomControl {
  shouldAutoAttach: () => boolean,
  shouldAutoPublish: () => boolean,
};

export function createRoomControls(
  container: HTMLElement,
  Video: typeof import('twilio-video'),
  localTracks: LocalTrack[],
  roomJoined: (room: Room, logger: log.Logger, env?: string) => void
): IRoomControl {
  const urlParams = new URLSearchParams(window.location.search);
  const roomControlsDiv = createDiv(container, sheet.classes.roomControls, 'room-controls') as HTMLDivElement;

  const twilioVideoVersion = createElement({ container: roomControlsDiv, type: 'h3', id: 'twilioVideoVersion' });
  twilioVideoVersion.innerHTML = 'Twilio-Video@' + Video.version;

  const topologySelect = createSelection({
    id: 'topology',
    container: roomControlsDiv,
    options: ['group-small', 'peer-to-peer', 'group', 'go'],
    title: 'topology',
    onChange: () => log2('topology change:', topologySelect.getValue())
  });

  let extraConnectOptions: { value: string; };
  const envSelect = createSelection({
    id: 'env',
    container: roomControlsDiv,
    options: ['dev', 'stage', 'prod'],
    title: 'env',
    onChange: () => {
      const newEnv = envSelect.getValue();
      if (newEnv === 'dev') {
        // eslint-disable-next-line no-use-before-define
        extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify({ wsServer: 'wss://us2.vss.dev.twilio.com/signaling' });
      }
      log2('env change:', newEnv);
    }
  });

  const labelText = createLink({ container: roomControlsDiv, linkText: 'Token or ServerUrl', linkUrl: 'https://www.twilio.com/console/video/project/testing-tools', newTab: true });
  labelText.classList.add(sheet.classes.roomControlsLabel);
  const tokenInput = createLabeledInput({
    container: roomControlsDiv,
    labelText,
    placeHolder: 'Enter token or server url',
    labelClasses: ['tokenLabel'],
  });

  const localIdentity = createLabeledInput({
    container: roomControlsDiv,
    labelText: 'Identity: ',
    placeHolder: 'Enter identity or random one will be generated',
    labelClasses: [sheet.classes.roomControlsLabel],
  });

  const roomNameInput = createLabeledInput({
    container: roomControlsDiv,
    labelText: 'Room: ',
    placeHolder: 'Enter room name or random name will be generated',
    labelClasses: [sheet.classes.roomControlsLabel],
  });

  extraConnectOptions = createLabeledInput({
    container: roomControlsDiv,
    labelText: 'ConnectOptions: ',
    placeHolder: 'connectOptions as json here',
    labelClasses: [sheet.classes.roomControlsLabel],
    inputClasses: ['connectOptions'],
    inputType: 'textarea'
  });

  const controlOptionsDiv = createDiv(roomControlsDiv, sheet.classes.controlOptions, 'control-options');

  // container, labelText, id
  const autoPublish = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Publish', id: 'autoPublish' });
  const autoAttach = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Attach', id: 'autoAttach' });
  const autoJoin = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Join', id: 'autoJoin' });
  const autoRecord = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Record Participant', id: 'recordParticipant' });

  // process parameters.

  roomNameInput.value = urlParams.get('room') || randomRoomName();
  localIdentity.value = urlParams.get('identity') || randomName();
  const { protocol, host, pathname } = window.location;
  console.log({ protocol, host, pathname });
  const serverUrl = urlParams.get('server') || 'http://localhost:3000';
  tokenInput.value = urlParams.get('token') || serverUrl;

  // for working with dev env use: {"wsServer":"wss://us2.vss.dev.twilio.com/signaling"}
  extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify({ networkQuality: true });
  autoJoin.checked = urlParams.has('room') && urlParams.has('autoJoin');
  topologySelect.setValue(urlParams.get('topology') || 'group-small');
  // wsServer.value = urlParams.get('wsserver');
  envSelect.setValue(urlParams.get('env') || 'prod');
  autoAttach.checked = getBooleanUrlParam('autoAttach', true);
  autoPublish.checked = getBooleanUrlParam('autoPublish', true);
  autoRecord.checked = getBooleanUrlParam('record', false);

  /**
   * Get the Room credentials from the server.
   * @param {string} [identity] identity to use, if not specified server generates random one.
   * @returns {Promise<{identity: string, token: string}>}
   */

  async function getRoomCredentials() {
    const identity = localIdentity.value || randomName();
    let token = tokenInput.value;

    // if token input is server url
    if (token.indexOf('http') >= 0) {
      let tokenUrl = token;
      const topology = topologySelect.getValue();
      const environment = envSelect.getValue();
      const roomName = roomNameInput.value;
      const recordParticipantsOnConnect = autoRecord.checked ? 'true': 'false';

      let url = new URL(tokenUrl + '/token');

      console.log('Getting Token For: ', { environment, topology, roomName, identity, recordParticipantsOnConnect });
      const tokenOptions = { environment, topology, roomName, identity, recordParticipantsOnConnect };
      url.search = (new URLSearchParams(tokenOptions)).toString();
      const response = await fetch(url.toString());
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Failed to obtain token from ${url}, Status: ${response.status}`);
    } else if (token.length === 0) {
      throw new Error('Must specify token or tokenUrl');
    }

    return { token, identity };
  }


  function joinRoom(token: string) {
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

    log2(`Joining room ${roomName} ${autoPublish.checked ? 'with' : 'without'} ${localTracks.length} localTracks`);
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
    log2(`Joining room ${roomName} with ${JSON.stringify(connectOptions, null, 2)}`);

    Video.connect(token, connectOptions)
      .then(room => {
        roomJoined(room, logger, envSelect.getValue());
        // get new local identity for next join.
        localIdentity.value = randomName();
      }).catch(error => {
        log2('Could not connect to Twilio: ' + error.message);
      });
  }

  // eslint-disable-next-line consistent-return
  const btnJoin = createButton('Join', roomControlsDiv, async () => {
    try {
      const token = (await getRoomCredentials()).token;
      return joinRoom(token);
    } catch (ex) {
      log2('Failed: ', ex);
    }
  });

  if (autoJoin.checked) {
    btnJoin.click();
  }

  // @ts-ignore
  const testPreflight = Video.testPreflight;
  if (testPreflight === 'function') {
    let preflightTest = null;
    createButton('preparePreflight', roomControlsDiv, async () => {
      const aliceToken = (await getRoomCredentials()).token;
      const bobToken = (await getRoomCredentials()).token;
      createButton('testPreflight', roomControlsDiv, async () => {
        console.log('starting preflight');
        const environment = envSelect.getValue();
        preflightTest = testPreflight(aliceToken, bobToken, { duration: 10000, environment });
        const deferred: { reject?: (e: Error) => void, resolve?: (report: any) => void, promise?: Promise<any> } = {};
        deferred.promise = new Promise((resolve, reject) => {
          deferred.resolve = resolve;
          deferred.reject = reject;
        });

        const logger = Video.Logger.getLogger('twilio-video');
        preflightTest.on('debug', (room1: Room, room2: Room) => {
          console.log('preflight debug:', room1, room2);
          roomJoined(room1, logger);
          roomJoined(room2, logger);
        });

        preflightTest.on('progress', (progress: string)  => {
          console.log('preflight progress:', progress);
        });

        preflightTest.on('error', (error: Error) => {
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
    // TODO: also add getServerUrl
    shouldAutoAttach: () => autoAttach.checked,
    shouldAutoPublish: () => autoPublish.checked
  };
}


