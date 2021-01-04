/* eslint-disable no-console */
import { createButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createElement } from './components/createElement';
import { createLabeledStat, ILabeledStat } from './components/labeledstat';
import { createLink } from './components/createLink';
import { createSelection } from './components/createSelection';
import { getCreds } from './getCreds';
import { log as log2 } from './components/log';
import { renderTrack } from './renderTrack';
import { updateTrackStats } from './renderLocalTrack';
import {
  Room,
  LocalTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  TwilioError,
  RemoteParticipant,
  TrackPublication,
  RemoteTrackPublication,
  LocalAudioTrackStats,
  LocalVideoTrackStats,
  RemoteAudioTrackStats,
  RemoteVideoTrackStats,
  Track,
  Participant
} from 'twilio-video';
import { createHeader } from './createHeader';

import log from 'logLevel';

import jss from './jss'

// Create your style.
const style = {
  background_gray: {
    background: 'gray',
  },
  background_yellow: {
    background: 'yellow',
  },
  background_green: {
    background: 'lightgreen',
  },
  background_red: {
    background: 'red',
  },
  remoteParticipants: {
    display: 'flex',
    height: 'auto',
    margin: 'auto',
    width: '100%',
    'justify-content': 'flex-start',
    'flex-wrap': 'wrap',
    'background-color': '#fff',
    'text-align': 'center',
  },
  roomContainer: {
    display: 'flex',
    margin: '5px',
    'flex-direction': 'column',
    border: 'solid black 1px',
  },
  remoteTrackControls: {
    /* since it attaches to track container */
    /* does not need top border */
    'border-bottom': 'solid 1px black',
    'border-left': 'solid 1px black',
    'border-right': 'solid 1px black',
  },
  participantDiv: {
    margin: '2px',
  },
  participantMediaDiv: {
    padding: '5px',
    display: 'flex',
    'flex-wrap': 'wrap'
  },
  roomHeaderDiv: {
    display: 'flex'
  },
  publication: {
    padding: '5px'
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export type IRenderedRemoteTrackPublication = {
  setBytesReceived: (bytesReceived: number, timestamp: number) => void;
  trackPublication: RemoteTrackPublication;
  container: HTMLElement;
  stopRendering: () => void;
}

function renderRemoteTrackPublication(trackPublication : RemoteTrackPublication, container : HTMLElement, autoAttach: boolean): IRenderedRemoteTrackPublication {
  const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
  container = createDiv(container, sheet.classes.publication, trackContainerId);

  const trackSid = createHeader({ container, type: 'h6', text: `${trackPublication.kind}:${trackPublication.trackSid}` });

  let renderedTrack: { stopRendering: any; trackContainer?: any; track?: any; updateStats?: () => void; } | null;
  let statBytes: ILabeledStat;
  let priority: ILabeledStat;
  let publisherPriority: ILabeledStat;

  function canRenderTrack(track: any): track is LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack {
    return track;
  }

  function renderRemoteTrack() {
    const track = trackPublication.track;
    if (canRenderTrack(track)) {

      renderedTrack = renderTrack({
        track,
        container,
        autoAttach
      });
      const trackBytesDiv = createDiv(container, sheet.classes.remoteTrackControls, 'remoteTrackControls');
      statBytes = createLabeledStat({
        container: trackBytesDiv,
        label: 'received kbps',
        valueMapper: (text: string) => text === '0' ? sheet.classes.background_yellow : undefined
      });
      statBytes.setText('0');
      priority = createLabeledStat({ container: trackBytesDiv, label: 'subscriber priority'});
      priority.setText(`${track.priority}`);

      publisherPriority = createLabeledStat({ container: trackBytesDiv, label: 'publisher priority' });
      publisherPriority.setText(`${trackPublication.publishPriority}`);
      trackPublication.on('publishPriorityChanged', () => {
        publisherPriority.setText(`${trackPublication.publishPriority}`);
      });

    } else {
      console.warn('CanRender returned false for ', track);
    }
  }

  if (trackPublication.isSubscribed) {
    renderRemoteTrack();
  }

  trackPublication.on('subscribed', function(track) {
    log2(`Subscribed to ${trackPublication.kind}:${track.name}`);
    renderRemoteTrack();
  });

  trackPublication.on('unsubscribed', () => {
    renderedTrack?.stopRendering();
    renderedTrack = null;
  });

  let previousBytes = 0;
  let previousTime = 0;
  return {
    setBytesReceived: (bytesReceived: number, timeStamp: number) => {
      if (statBytes) {
        const round = (num: number) => Math.round((num + Number.EPSILON) * 10) / 10;
        const bps =  round((bytesReceived - previousBytes) / (timeStamp - previousTime));
        previousBytes = bytesReceived;
        previousTime = timeStamp;
        statBytes.setText(bps.toString());
      }
    },
    trackPublication,
    container,
    stopRendering: () => {
      if (renderedTrack) {
        renderedTrack.stopRendering();
        renderedTrack = null;
      }
      container.remove();
    }
  };
}
export type IRenderedRemoteParticipant = {
  container: HTMLElement;
  updateStats: ({ trackSid, bytesReceived, timestamp } : { trackSid: string, bytesReceived: number, timestamp: number }) => void;
  stopRendering: () => void;
}

export function renderRemoteParticipant(participant: RemoteParticipant, container:HTMLElement, shouldAutoAttach: () => boolean) : IRenderedRemoteParticipant {
  container = createDiv(container, sheet.classes.participantDiv, `participantContainer-${participant.identity}`);

  const participantName  = createHeader({ container, text: participant.identity });
  const participantMedia = createDiv(container, sheet.classes.participantMediaDiv);
  const renderedPublications = new Map<Track.SID, IRenderedRemoteTrackPublication>();
  participant.tracks.forEach(publication => {
    const rendered = renderRemoteTrackPublication(publication, participantMedia, shouldAutoAttach());
    renderedPublications.set(publication.trackSid, rendered);
  });

  participant.on('trackPublished', publication => {
    const rendered = renderRemoteTrackPublication(publication, participantMedia, shouldAutoAttach());
    renderedPublications.set(publication.trackSid, rendered);
  });
  participant.on('trackUnpublished', publication => {
    const rendered = renderedPublications.get(publication.trackSid);
    if (rendered) {
      rendered.stopRendering();
      renderedPublications.delete(publication.trackSid);
    }
  });
  return {
    container,
    updateStats: ({ trackSid, bytesReceived, timestamp } : { trackSid: string, bytesReceived: number, timestamp: number }) => {
      renderedPublications.forEach((renderedTrackpublication: IRenderedRemoteTrackPublication, renderedTrackSid: Track.SID) => {
        if (trackSid === renderedTrackSid) {
          renderedTrackpublication.setBytesReceived(bytesReceived, timestamp);
        }
      })
    },
    stopRendering: () => {
      renderedPublications.forEach((renderedTrackpublication: IRenderedRemoteTrackPublication, renderedTrackSid: Track.SID) => {
        renderedTrackpublication.stopRendering();
        renderedPublications.delete(renderedTrackSid);
      })
      container.remove();
    }
  };
}

async function renderExtraRoomInformation({ room, container, env, getServerUrl }:
  {
    room: Room,
    container: HTMLElement,
    env: string,
    getServerUrl: () => string,
  }) {
  let credentialsAt;
  let creds: { signingKeySid: any; signingKeySecret: any; };
  try {
    creds = await getCreds(env, getServerUrl());
    credentialsAt = `${creds.signingKeySid}:${creds.signingKeySecret}@`;
  } catch (e) {
    log2('failed to load credentials: ', e);
    credentialsAt = '';
  }

  const baseUrl = env === 'prod' ? `https://${credentialsAt}video.twilio.com` : `https://${credentialsAt}video.${env}.twilio.com`;

  createLink({ container, linkText: 'RecordingRules', linkUrl: `${baseUrl}/v1/Rooms/${room.sid}/RecordingRules`, newTab: true });

  createButton('copy start recording', container, () => {
    const command = `curl -X POST '${baseUrl}/v1/Rooms/${room.sid}/RecordingRules' \
    -u '${creds.signingKeySid}:${creds.signingKeySecret}' \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d 'Rules=[{"type": "include", "all": "true"}]'`;
    navigator.clipboard.writeText(command);
  });

  createButton('copy stop recording', container, () => {
    const command = `curl -X POST '${baseUrl}/v1/Rooms/${room.sid}/RecordingRules' \
    -u '${creds.signingKeySid}:${creds.signingKeySecret}' \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d 'Rules=[{"type": "exclude", "all": "true"}]'`;
    navigator.clipboard.writeText(command);
  });

  createLink({ container, linkText: `/v1/Rooms/${room.sid}`, linkUrl: `${baseUrl}/v1/Rooms/${room.sid}`, newTab: true });

  // this works.
  // createButton('fetch room', roomHeaderDiv, async () => {
  //   try {
  //     var headers = new Headers();
  //     headers.append('Authorization', 'Basic ' + btoa(creds.signingKeySid + ':' + creds.signingKeySecret));
  //     const result = await fetch(`${baseUrlNoCredentials}/v1/Rooms/${room.sid}`, { headers });
  //     log(result);
  //   } catch (e) {
  //     log('Error fetching: ', e);
  //   }
  // });
}


function getCurrentLoggerLevelAsString(logger: log.Logger): string {
  const levelNumToString = new Map<number, string>() ;
  levelNumToString.set(logger.levels.TRACE, 'TRACE');
  levelNumToString.set(logger.levels.DEBUG, 'DEBUG');
  levelNumToString.set(logger.levels.INFO, 'INFO');
  levelNumToString.set(logger.levels.WARN, 'WARN');
  levelNumToString.set(logger.levels.ERROR, 'ERROR');
  levelNumToString.set(logger.levels.SILENT, 'SILENT');
  const currentLevelStr = levelNumToString.get(logger.getLevel()) as string;
  return currentLevelStr;
}

export async function renderRoom({ room, container, shouldAutoAttach, renderExtraInfo, getServerUrl, env = 'prod', logger }: {
  room: Room,
  container: HTMLElement,
  shouldAutoAttach: () => boolean,
  renderExtraInfo: () => boolean,
  getServerUrl: () => string,
  env?: string,
  logger: log.Logger
}) {
  container = createDiv(container, sheet.classes.roomContainer);
  console.log(logger.levels);
  const options  = Object.keys(logger.levels);
  const currentLevel = getCurrentLoggerLevelAsString(logger);
  const logLevelSelect = createSelection({
    id: 'logLevel',
    container,
    options,
    // options: ['warn', 'debug', 'info', 'error', 'silent'],
    title: 'logLevel',
    onChange: () => {
      log2(`setting logLevel: ${logLevelSelect.getValue()} for ${room.localParticipant.identity} in ${room.sid}`);
      logger.setLevel(logLevelSelect.getValue() as log.LogLevelDesc);
    }
  });

  logLevelSelect.setValue(currentLevel);

  const roomSid = createHeader( { container, text: `${room.localParticipant.identity} in ${room.sid}`});
  const btnDisconnect = createButton('disconnect', container, () => {
    room.disconnect();
    container.remove();
  });
  if (renderExtraInfo()) {
    await renderExtraRoomInformation({ env, room, container, getServerUrl  });
  }
  const roomState = createLabeledStat({
    container,
    label: 'room.state',
    valueMapper: (text: string) => {
      switch(text) {
        case 'connected': return sheet.classes.background_green;
        case 'reconnecting': return sheet.classes.background_yellow;
        case 'disconnected': return sheet.classes.background_red;
        default:
          return sheet.classes.background_red;
      }
   }
  });
  const recording = createLabeledStat({
    container,
    label: 'room.isRecording',
    valueMapper: (text: string) => text === 'true' ? sheet.classes.background_red : undefined
  });

  const networkQuality = createLabeledStat({
    container,
    label: 'room.localParticipant.networkQualityLevel',
    valueMapper: (text: string) => {
      switch(text) {
        case 'null':
          return sheet.classes.background_gray;
        case '0':
        case '1':
          return sheet.classes.background_red;
        case '2':
        case '3':
            return sheet.classes.background_yellow;
        case '4':
        case '5':
          return sheet.classes.background_green;
        default:
          return sheet.classes.background_red;
      }
    }
  });

  const updateNetworkQuality = () => {
    console.log('room.localParticipant.networkQualityLevel: ', room.localParticipant.networkQualityLevel);

    networkQuality.setText(`${room.localParticipant.networkQualityLevel}`);
  };
  const updateRecordingState = () => recording.setText(`${room.isRecording}`);
  const updateRoomState = () => roomState.setText(room.state);

  room.localParticipant.addListener('networkQualityLevelChanged', updateNetworkQuality);
  room.addListener('disconnected', updateRoomState);
  room.addListener('reconnected', updateRoomState);
  room.addListener('reconnecting', updateRoomState);
  room.addListener('recordingStarted', () => {
    log2('recordingStarted');
    updateRecordingState();
  });
  room.addListener('recordingStopped', () => {
    log2('recordingStopped');
    updateRecordingState();
  });
  updateRoomState();
  updateRecordingState();
  updateNetworkQuality();

  const isDisconnected = room.state === 'disconnected';

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', () => room.disconnect());

  btnDisconnect.show(!isDisconnected);

  const renderedParticipants = new Map<Participant.SID, IRenderedRemoteParticipant>();
  const remoteParticipantsContainer = createDiv(container, sheet.classes.remoteParticipants, 'remote-participants');
  room.participants.forEach(participant => {
    renderedParticipants.set(participant.sid, renderRemoteParticipant(participant, remoteParticipantsContainer, shouldAutoAttach));
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', participant => {
    renderedParticipants.set(participant.sid, renderRemoteParticipant(participant, remoteParticipantsContainer, shouldAutoAttach));
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', participant => {
    const rendered = renderedParticipants.get(participant.sid);
    if (rendered) {
      rendered.stopRendering();
      renderedParticipants.delete(participant.sid);
    }
  });

  var statUpdater = setInterval(async () => {
    const statReports = await room.getStats();
    statReports.forEach(statReport => {
      [
        statReport.localAudioTrackStats,
        statReport.localVideoTrackStats,
      ].forEach(trackStatArr => {
        trackStatArr.forEach((trackStat: LocalAudioTrackStats | LocalVideoTrackStats) => {
          const { trackId, trackSid, bytesSent, timestamp } = trackStat;
          updateTrackStats({ room, trackId, trackSid, bytesSent, timestamp });
        })
      });

      [
        statReport.remoteVideoTrackStats,
        statReport.remoteAudioTrackStats,
      ].forEach(trackStatArr => {
        trackStatArr.forEach((trackStat: RemoteAudioTrackStats |RemoteVideoTrackStats) => {
          const { trackSid, timestamp } = trackStat;
          const bytesReceived = trackStat.bytesReceived || 0;
          renderedParticipants.forEach((renderedParticipant: IRenderedRemoteParticipant, participantSid: Participant.SID) => {
            renderedParticipant.updateStats({ trackSid, bytesReceived, timestamp });
          })
        })
      });

    })
  }, 1000);

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', () => {
    clearInterval(statUpdater);
    renderedParticipants.forEach((renderedParticipant: IRenderedRemoteParticipant, participantSid: Participant.SID) => {
      renderedParticipant.stopRendering();
      renderedParticipants.delete(participantSid);
    });
  });
}
