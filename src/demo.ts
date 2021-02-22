/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

import { Room, Logger, LocalTrack, TwilioError} from 'twilio-video';
import { createLog, log } from './components/log';
import { createCollapsibleDiv } from './components/createCollapsibleDiv';
import { createDiv } from './components/createDiv';
import { createLocalTracksControls } from './createLocalTracksControls';
import { createRoomControls } from './createRoomControls';
import { renderRoom } from './renderRoom';
import jss from './jss'
import { createLink } from './components/createLink';

// Create your style.
const style = {
  mainDiv: {
    display: 'flex',
    height: 'auto',
    width: '100%',
    border: 'solid red 1px',
    padding: '2px',
    'box-sizing': 'border-box',
    'justify-content': 'flex-start',
    'flex-wrap': 'wrap',
    'background-color': '#fff',
    'text-align': 'center',
  },
  localControls: {
    display: 'flex',
    width: '100%',
    'background-color': '#fff',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export function demo(Video: typeof import('twilio-video'), containerDiv: HTMLElement) {
  // link to source code
  createLink({ container: containerDiv, linkText: 'Twilio-Video-API-Demo', linkUrl: 'https://github.com/makarandp0/twilio-video-api', newTab: true });

  // create html
  const container = createDiv(containerDiv, sheet.classes.mainDiv, 'main');
  createLog(containerDiv);
  log("Version: ", Video.version);
  log("IsSupported: ", Video.isSupported);
  log("UserAgent: ", navigator.userAgent);

  const localTracks: LocalTrack[] = [];
  const rooms: Room[] = [];

  // @ts-ignore
  window.Twilio = { Video, rooms };
  const  { shouldAutoAttach, shouldAutoPublish, renderExtraInfo, getServerUrl, getRoomControlsDiv } = createRoomControls(
    container,
    Video,
    localTracks,
    roomJoined,
  );

  const buttonContainer = getRoomControlsDiv();
  const { roomAdded, roomRemoved } = createLocalTracksControls({
    buttonContainer,
    container,
    Video,
    localTracks,
    rooms,
    shouldAutoAttach,
    shouldAutoPublish,
  });

  // Successfully connected!
  function roomJoined(room: Room, logger : typeof Logger, env: string) {
    logger = logger || Video.Logger.getLogger('twilio-video');
    rooms.push(room);
    roomAdded(room);
    log(`Joined ${room.sid} as "${room.localParticipant.identity}"`);
    renderRoom({ room, container, shouldAutoAttach, renderExtraInfo, getServerUrl, env, logger });
    room.on('disconnected', (_, err) => {
      log(`Left ${room.sid} as "${room.localParticipant.identity}"`);
      if (err) {
        log('Error:', err);
      }
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
      }
      roomRemoved(room);
    });
  }
}


