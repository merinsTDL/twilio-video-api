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
  RemoteVideoTrackStats
} from 'twilio-video';
import log from 'logLevel';


function renderTrackPublication(trackPublication : RemoteTrackPublication, container : HTMLElement, autoAttach: boolean) {
  const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
  container = createDiv(container, 'publication', trackContainerId);
  const trackSid = createElement({ container, type: 'h6', classNames: ['participantSid'] });
  trackSid.innerHTML = `${trackPublication.kind}:${trackPublication.trackSid}`;

  let renderedTrack: { stopRendering: any; trackContainer?: any; track?: any; updateStats?: () => void; } | null;
  let statBytes: ILabeledStat;

  function canRenderTrack(track: any): track is LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack {
    return track;
  }

  function renderLocalTrack() {
    const track = trackPublication.track;
    if (canRenderTrack(track)) {
      renderedTrack = renderTrack({
        track,
        container,
        autoAttach
      });
      const trackBytesDiv = createDiv(container, 'remoteTrackControls');
      statBytes = createLabeledStat({ container: trackBytesDiv, label: 'bytes recd', className: 'bytes', useValueToStyle: true });
      statBytes.setText('0');
    } else {
      console.warn('CanRender returned false for ', track);
    }
  }

  if (trackPublication.isSubscribed) {
    renderLocalTrack();
  }

  trackPublication.on('subscribed', function(track) {
    log2(`Subscribed to ${trackPublication.kind}:${track.name}`);
    renderLocalTrack();
  });

  trackPublication.on('unsubscribed', () => {
    renderedTrack?.stopRendering();
    renderedTrack = null;
  });

  return {
    setBytesReceived: (bytesReceived: number) => {
      if (statBytes) {
        statBytes.setText(bytesReceived.toString());
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

export function renderParticipant(participant: RemoteParticipant, container:HTMLElement, shouldAutoAttach: () => boolean) {
  container = createDiv(container, 'participantDiv', `participantContainer-${participant.identity}`);
  const name = createElement({ container, type: 'h3', classNames: ['participantName'] });

  name.innerHTML = participant.identity;
  const participantMedia = createDiv(container, 'participantMediaDiv');
  const renderedPublications = new Map();
  participant.tracks.forEach(publication => {
    const rendered = renderTrackPublication(publication, participantMedia, shouldAutoAttach());
    renderedPublications.set(publication.trackSid, rendered);
  });

  participant.on('trackPublished', publication => {
    const rendered = renderTrackPublication(publication, participantMedia, shouldAutoAttach());
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
    updateStats: ({ trackSid, bytesReceived } : { trackSid: string, bytesReceived: number }) => {
      Array.from(renderedPublications.keys()).forEach(thisTrackSid => {
        if (trackSid === thisTrackSid) {
          renderedPublications.get(thisTrackSid).setBytesReceived(bytesReceived);
        }
      });
    },
    stopRendering: () => {
      Array.from(renderedPublications.keys()).forEach(trackSid => {
        renderedPublications.get(trackSid).stopRendering();
        renderedPublications.delete(trackSid);
      });
      container.remove();
    }
  };
}

async function createRoomButtons({ room, container, env }: { room: Room, container: HTMLElement, env: string }) {
  let credentialsAt;
  let creds: { signingKeySid: any; signingKeySecret: any; };
  try {
    creds = await getCreds(env);
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

export async function renderRoom({ room, container, shouldAutoAttach, env = 'prod', logger }: {
  room: Room,
  container: HTMLElement,
  shouldAutoAttach: () => boolean,
  env?: string,
  logger: log.Logger
}) {
  container = createDiv(container, 'room-container');
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

  const roomHeaderDiv = createDiv(container, 'roomHeaderDiv');

  const roomSid = createElement({ container: roomHeaderDiv, type: 'h3', classNames: ['roomHeaderText'] });
  roomSid.innerHTML = ` ${room.sid} `;
  await createRoomButtons({ env, room, container  });
  const localParticipant = createLabeledStat({ container, label: 'localParticipant', className: 'localParticipant', useValueToStyle: true });
  localParticipant.setText(room.localParticipant.identity);
  const roomState = createLabeledStat({ container, label: 'room.state', className: 'roomstate', useValueToStyle: true });
  const recording = createLabeledStat({ container, label: 'room.isRecording', className: 'recording', useValueToStyle: true });
  const networkQuality = createLabeledStat({ container, label: 'room.localParticipant.networkQualityLevel', className: 'networkquality', useValueToStyle: true });

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
  const btnDisconnect = createButton('disconnect', roomHeaderDiv, () => {
    room.disconnect();
    container.remove();
  });

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', () => room.disconnect());

  btnDisconnect.show(!isDisconnected);

  const renderedParticipants = new Map();
  const remoteParticipantsContainer = createDiv(container, 'remote-participants', 'remote-participants');
  room.participants.forEach(participant => {
    renderedParticipants.set(participant.sid, renderParticipant(participant, remoteParticipantsContainer, shouldAutoAttach));
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', participant => {
    renderedParticipants.set(participant.sid, renderParticipant(participant, remoteParticipantsContainer, shouldAutoAttach));
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
          const { trackId, trackSid, bytesSent } = trackStat;
          updateTrackStats({ room, trackId, trackSid, bytesSent });
        })
      });

      [
        statReport.remoteVideoTrackStats,
        statReport.remoteAudioTrackStats,
      ].forEach(trackStatArr => {
        trackStatArr.forEach((trackStat: RemoteAudioTrackStats |RemoteVideoTrackStats) => {
          const { trackId, trackSid, bytesReceived } = trackStat;
          Array.from(renderedParticipants.keys()).forEach(key => {
            renderedParticipants.get(key).updateStats({ trackId, trackSid, bytesReceived, trackType: typeof trackStat });
          });
        })
      });

    })
  }, 100);

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', () => {
    clearInterval(statUpdater);
    Array.from(renderedParticipants.keys()).forEach(key => {
      renderedParticipants.get(key).stopRendering();
      renderedParticipants.delete(key);
    });
  });
}
