/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

import { Room, Logger, LocalTrack, TwilioError} from 'twilio-video';
import { createLog, log } from './old_jsutilmodules/log.js';
import { createCollapsibleDiv } from './old_jsutilmodules/createCollapsibleDiv.js';
import { createDiv } from './old_jsutilmodules/createDiv.js';
import { createLocalTracksControls } from './old_es6/createLocalTracksControls.js';
import { createRoomControls } from './old_es6/createRoomControls.js';
import { renderRoom } from './old_es6/renderRoom.js';

export function demo(Video: typeof import("twilio-video"), containerDiv: HTMLElement) {
  // create html
  const mainDiv = createDiv(containerDiv, 'main', 'main');
  createLog(containerDiv);
  log("Version: ", Video.version);
  log("IsSupported: ", Video.isSupported);
  log("UserAgent: ", navigator.userAgent);

  const container = createCollapsibleDiv({ container: mainDiv, headerText: 'Local Controls', divClass: 'localControls' });

  const localTracks: LocalTrack[] = [];
  const rooms: Room[] = [];
  // window.Twilio = { Video, rooms };
  const  { shouldAutoAttach, shouldAutoPublish, getEnv } = createRoomControls({
    container,
    Video,
    localTracks,
    roomJoined,
  });

  const { roomAdded, roomRemoved } = createLocalTracksControls({
    container,
    Video,
    localTracks,
    rooms,
    shouldAutoAttach,
    shouldAutoPublish,
  });

  // Successfully connected!
  function roomJoined(room: Room, logger : typeof Logger) {
    logger = logger || Video.Logger.getLogger('twilio-video');
    rooms.push(room);
    roomAdded(room);
    log(`Joined ${room.sid} as "${room.localParticipant.identity}"`);
    renderRoom({ room, container: mainDiv, shouldAutoAttach, env: getEnv(), logger });
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


