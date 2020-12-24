/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

import { Room, Logger, LocalTrack, TwilioError} from 'twilio-video';
import { createLog, log as log2} from './components/log';
import { createCollapsibleDiv } from './components/createCollapsibleDiv';
import { createDiv } from './components/createDiv';
import { createLocalTracksControls } from './createLocalTracksControls';
import { createRoomControls } from './createRoomControls';
import { renderRoom } from './renderRoom';
import log from 'logLevel';

export function demo(Video: typeof import('twilio-video'), containerDiv: HTMLElement) {
  // create html
  const mainDiv = createDiv(containerDiv, 'main', 'main');
  createLog(containerDiv);
  log2("Version: ", Video.version);
  log2("IsSupported: ", Video.isSupported);
  log2("UserAgent: ", navigator.userAgent);

  const container = createCollapsibleDiv({ container: mainDiv, headerText: 'Local Controls', divClass: 'localControls' });

  const localTracks: LocalTrack[] = [];
  const rooms: Room[] = [];

  // @ts-ignore
  window.Twilio = { Video, rooms };
  const  { shouldAutoAttach, shouldAutoPublish } = createRoomControls(
    container,
    Video,
    localTracks,
    roomJoined,
  );

  const { roomAdded, roomRemoved } = createLocalTracksControls({
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
    log2(`Joined ${room.sid} as "${room.localParticipant.identity}"`);
    renderRoom({ room, container: mainDiv, shouldAutoAttach, env, logger });
    room.on('disconnected', (_, err) => {
      log2(`Left ${room.sid} as "${room.localParticipant.identity}"`);
      if (err) {
        log2('Error:', err);
      }
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
      }
      roomRemoved(room);
    });
  }
}


