/* eslint-disable no-console */
import { createButton, IButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createElement } from './components/createElement';
import { createLabeledStat, ILabeledStat } from './components/labeledstat';
import { log } from './components/log';
import { renderTrack } from './renderTrack';
import { Room, LocalAudioTrack, LocalVideoTrack, Track, TrackPublication, LocalTrackPublication } from 'twilio-video';

import jss from './jss'
import { createCollapsibleDiv } from './components/createCollapsibleDiv';

// Create your style.
const style = {
  background_gray: {
    background: 'gray',
  },
  background_green: {
    background: 'lightgreen',
  },
  localTrackControls: {
    /* since it attaches to track container */
    /* does not need top border */
    'border-bottom': 'solid 1px black',
    'border-left': 'solid 1px black',
    'border-right': 'solid 1px black',
  },
  localTrackContainer: {
    padding: '5px',
    'max-width': '300px',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();


const publishControls = new Map<Track.SID, Map<Room, IPublishControl>>();
export function updateTrackStats({ room, trackId, trackSid, bytesSent, timestamp } : {
  room: Room,
  trackId: Track.SID,
  trackSid: Track.SID,
  timestamp: number,
  bytesSent: number | null
}) {
  const trackPublishControls = publishControls.get(trackId);
  if (trackPublishControls) {
    const publishControl = trackPublishControls.get(room);
    if (publishControl) {
        bytesSent = bytesSent || 0;
        publishControl.updateTrackStats({ trackSid, bytesSent, timestamp });
    }
  }
}

type IPublishControl = {
  unPublishBtn: IButton;
  stopRendering: () => void;
  updateTrackStats: ({trackSid, bytesSent, timestamp} : { trackSid: Track.SID, bytesSent: number, timestamp: number}) => void
}

// creates buttons to publish unpublish track in a given room.
function createRoomPublishControls(container: HTMLElement, room: Room, track: LocalAudioTrack | LocalVideoTrack, shouldAutoPublish: boolean): IPublishControl {
  container = createDiv(container, sheet.classes.localTrackControls, 'localTrackControls');
  const roomSid = createElement({ container, type: 'h8', classNames: ['roomHeader'] });

  roomSid.innerHTML = room.localParticipant.identity;

  let priorityButtons: IButton[] = [];
  let unPublishBtn: IButton;
  let publishBtn: IButton;
  let statBytes: ILabeledStat;
  let priority: ILabeledStat;
  let trackPublication: LocalTrackPublication | null = Array.from(room.localParticipant.tracks.values()).find(trackPub => trackPub.track === track) || null;
  let previousBytes = 0;
  let previousTime = 0;
  const updateControls = () => {

    // show priority buttons only when trackPublication is available.
    priorityButtons.forEach(priButton => priButton.show(!!trackPublication))

    publishBtn.show(!trackPublication);
    unPublishBtn.show(!!trackPublication);
    statBytes.setText('0');
    priority.setText(`${trackPublication?.priority}`);
    previousBytes = 0;
    previousTime = 0;
  };

  publishBtn = createButton('publish', container, async () => {
    publishBtn.disable();
    if (!trackPublication) {
      // eslint-disable-next-line require-atomic-updates
      trackPublication = await room.localParticipant.publishTrack(track);
      updateControls();
    }
    publishBtn.enable();
  });
  unPublishBtn = createButton('unpublish', container, () => {
    if (trackPublication) {
      trackPublication.unpublish();
      trackPublication = null;
      updateControls();
    }
  });

  statBytes = createLabeledStat({
    container,
    label: 'sent (kbps)',
    valueMapper: (text: string) => text === '0' ? sheet.classes.background_gray : sheet.classes.background_green
  });

  priority = createLabeledStat({
    container,
    label: 'publish priority'
  });

  // set publish priority.
  ['high', 'standard', 'low'].forEach(priorityText => {
    const button = createButton(priorityText, container, () => {
      trackPublication?.setPriority(priorityText as Track.Priority);
      updateControls();
    });
    priorityButtons.push(button);
  })

  updateControls();

  if (shouldAutoPublish) {
    publishBtn.click();
  }

  return {
    unPublishBtn,
    updateTrackStats: ({ trackSid, bytesSent, timestamp } : {
      trackSid: Track.SID,
      bytesSent: number,
      timestamp: number
    }) => {
      if (trackPublication && trackPublication.trackSid === trackSid) {
        const round = (num: number) => Math.round((num + Number.EPSILON) * 10) / 10;
        const bps =  round((bytesSent - previousBytes) / (timestamp - previousTime));
        previousBytes = bytesSent;
        previousTime = timestamp;

        statBytes.setText(bps.toString());
      }
    },
    stopRendering: () => {
      container.remove();
    }
  };
}

export interface IRenderedLocalTrack {
  roomAdded: (room: Room) => void;
  roomRemoved: (room: Room) => void;
}

export function renderLocalTrack({ rooms, track, container, autoAttach, autoPublish, onClosed, videoDevices = [] }: {
  rooms: Room[],
  track: LocalAudioTrack | LocalVideoTrack,
  container: HTMLElement,
  autoAttach: boolean,
  autoPublish: boolean,
  onClosed: () => void,
  videoDevices: MediaDeviceInfo[]
}): IRenderedLocalTrack {
  const { innerDiv: localTrackContainer, outerDiv } = createCollapsibleDiv({ container, headerText: 'LocalTrack', divClass: sheet.classes.localTrackContainer });
  // const localTrackContainer = createDiv(container, sheet.classes.localTrackContainer);
  const { stopRendering } = renderTrack({ track, container: localTrackContainer, autoAttach });

  const localTrackControls = createDiv(localTrackContainer, sheet.classes.localTrackControls);
  createButton('disable', localTrackControls, () => track.disable());
  createButton('enable', localTrackControls, () => track.enable());
  createButton('stop', localTrackControls, () => {
    log('stopping track');
    track.stop();
    log('done stopping track');
  });

  createButton('restart', localTrackControls, () => {
    track.restart().catch((err: Error) => {
      console.log('track.restart failed', err);
    });
  });

  videoDevices.forEach(device => {
    createButton(`restart: ${device.label}`, localTrackControls, () => {
      const videoConstraints = {
        deviceId: { exact: device.deviceId },
      };
      console.log('calling restart with: ', videoConstraints);
      track.restart(videoConstraints).catch(err => {
        console.log('track.restart failed', err);
      });
    });
  });

  const trackPublishControls = new Map<Room, IPublishControl>();
  publishControls.set(track.id, trackPublishControls);

  // for existing rooms, publish track if shouldAutoPublish
  rooms.forEach((room: Room) => {
    trackPublishControls.set(room, createRoomPublishControls(localTrackContainer, room, track, autoPublish));
  });

  const roomAdded = (room: Room) => {
    if (!trackPublishControls.get(room)) {
      // for any rooms that are joined after track - do not auto publish,
      // as room starts of ith tracks depending on auto publish.
      trackPublishControls.set(room, createRoomPublishControls(localTrackContainer, room, track, false));
    }
  };

  const roomRemoved = (room: Room) => {
    const roomPublishControl = trackPublishControls.get(room);
    if (roomPublishControl) {
      roomPublishControl.stopRendering();
      trackPublishControls.delete(room);
    }
  };

  createButton('close', localTrackControls, () => {
    trackPublishControls.forEach((roomPublishControl: IPublishControl, room: Room) => {
      roomPublishControl.unPublishBtn.click();
      roomPublishControl.stopRendering();
      trackPublishControls.delete(room);
    })
    stopRendering();
    track.stop();
    // localTrackContainer.remove();
    outerDiv.remove();
    onClosed();
  });

  return {
    roomAdded,
    roomRemoved
  };
}
