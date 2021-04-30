/* eslint-disable no-console */
import { createButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createLabeledStat } from './components/labeledstat';
import { createLink } from './components/createLink';
import { createSelection } from './components/createSelection';
import { REST_CREDENTIALS } from './getCreds';
import { log as log2 } from './components/log';
import { updateTrackStats } from './renderLocalTrack';
import {
  Log,
  Room,
  LocalVideoTrackStats,
  RemoteAudioTrackStats,
  RemoteVideoTrackStats,
  Participant,
  Track
} from 'twilio-video';
import { IRenderedRemoteParticipant, renderRemoteParticipant } from './renderRemoteParticipant';
import jss from './jss'
import { createCollapsibleDiv } from './components/createCollapsibleDiv';
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
  },
  collapsibleArea: {
    all:'inherit'
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();


async function renderExtraRoomInformation({ room, container, restCreds }:
  {
    room: Room,
    container: HTMLElement,
    restCreds: REST_CREDENTIALS,
  }) {
  const credentialsAt = `${restCreds.signingKeySid}:${restCreds.signingKeySecret}@`;
  const baseUrl = restCreds.restUrl;

  createLink({ container, linkText: 'RecordingRules', linkUrl: `${baseUrl}/v1/Rooms/${room.sid}/RecordingRules`, newTab: true });

  createButton('copy start recording', container, () => {
    const command = `curl -X POST '${baseUrl}/v1/Rooms/${room.sid}/RecordingRules' \
    -u '${restCreds.signingKeySid}:${restCreds.signingKeySecret}' \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d 'Rules=[{"type": "include", "all": "true"}]'`;
    navigator.clipboard.writeText(command);
  });

  createButton('copy stop recording', container, () => {
    const command = `curl -X POST '${baseUrl}/v1/Rooms/${room.sid}/RecordingRules' \
    -u '${restCreds.signingKeySid}:${restCreds.signingKeySecret}' \
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

function getCurrentLoggerLevelAsString(logger: Log.Logger): string {
  const currentLevel = logger.getLevel();
  console.log('logger currentLevel = ', currentLevel);
  const levelNumToString = new Map<number, string>() ;
  levelNumToString.set(logger.levels.TRACE, 'TRACE');
  levelNumToString.set(logger.levels.DEBUG, 'DEBUG');
  levelNumToString.set(logger.levels.INFO, 'INFO');
  levelNumToString.set(logger.levels.WARN, 'WARN');
  levelNumToString.set(logger.levels.ERROR, 'ERROR');
  levelNumToString.set(logger.levels.SILENT, 'SILENT');
  const currentLevelStr = levelNumToString.get(currentLevel) as string;
  return currentLevelStr;
}

export async function renderRoomDetails({ room, container, restCreds, logger }: {
  room: Room,
  container: HTMLElement,
  restCreds: REST_CREDENTIALS|null,
  logger: Log.Logger
}) {
  const { innerDiv, outerDiv: collapsible }  = createCollapsibleDiv({ container, headerText: `Room Details`, divClass: sheet.classes.roomContainer });
  container = innerDiv;
  const options  = Object.keys(logger.levels);
  const currentLevel = getCurrentLoggerLevelAsString(logger);
  const logLevelSelect = createSelection({
    id: 'logLevel',
    container,
    options,
    title: 'logLevel',
    onChange: () => {
      log2(`setting logLevel: ${logLevelSelect.getValue()} for ${room.localParticipant.identity} in ${room.sid}`);
      logger.setLevel(logLevelSelect.getValue() as Log.LogLevelDesc);
    }
  });

  logLevelSelect.setValue(currentLevel);

  if (restCreds !== null) {
    renderExtraRoomInformation({ room, container, restCreds });
  }

  createLabeledStat({ container, label: 'room.sid' }).setText(room.sid);
  createLabeledStat({ container, label: 'localParticipant' }).setText(room.localParticipant.identity);
  createLabeledStat({ container, label: 'localParticipant.sid' }).setText(room.localParticipant.sid);

  const roomState = createLabeledStat({
    container,
    label: 'state',
    valueMapper: (text: string) => {
      switch(text) {
        case 'connected': return undefined;
        case 'reconnecting': return sheet.classes.background_yellow;
        case 'disconnected': return sheet.classes.background_red;
        default:
          return sheet.classes.background_red;
      }
   }
  });
  const recording = createLabeledStat({
    container,
    label: 'isRecording',
    valueMapper: (text: string) => text === 'true' ? sheet.classes.background_red : undefined
  });

  const dominantSpeaker = createLabeledStat({ container, label: 'dominantSpeaker' });
  const updateDominantSpeaker = () => dominantSpeaker.setText(room.dominantSpeaker ? room.dominantSpeaker.identity : 'none');
  room.on('dominantSpeakerChanged', updateDominantSpeaker);
  updateDominantSpeaker();

  const networkQuality = createLabeledStat({
    container,
    label: 'localParticipant.networkQualityLevel',
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
          return undefined;
        default:
          return sheet.classes.background_red;
      }
    }
  });

  const updateNetworkQuality = () => networkQuality.setText(`${room.localParticipant.networkQualityLevel}`);
  room.localParticipant.addListener('networkQualityLevelChanged', updateNetworkQuality);

  const updateRecordingState = () => recording.setText(`${room.isRecording}`);
  const updateRoomState = () => roomState.setText(room.state);

  const mosScore = createLabeledStat({
    container,
    label: 'mos',
  });
  mosScore.setText('null');

  const updateMos = () => {
    // @ts-ignore
    const mos = room.mosScore;
    console.log('room.mosScore: ', mos);
    mosScore.setText(`${mos}`);
  };
  room.addListener('mosScoreChanged', updateMos);
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

}

export async function renderRoom({ room, container, shouldAutoAttach, restCreds, logger }: {
  room: Room,
  container: HTMLElement,
  shouldAutoAttach: () => boolean,
  restCreds: REST_CREDENTIALS|null,
  logger: Log.Logger
}) {

  const { innerDiv, outerDiv: collapsible }  = createCollapsibleDiv({ container, headerText: 'Room', divClass: sheet.classes.roomContainer });
  container = innerDiv;
  createLabeledStat({ container, label: 'class' }).setText('Room');

  renderRoomDetails({ room, container, restCreds, logger});
  const btnDisconnect = createButton('disconnect', container, () => {
    room.disconnect();
    collapsible.remove();
  });

  const isDisconnected = room.state === 'disconnected';

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', () => room.disconnect());

  btnDisconnect.show(!isDisconnected);

  const renderedParticipants = new Map<Participant.SID, IRenderedRemoteParticipant>();
  const remoteParticipantsContainer = createDiv(container, sheet.classes.remoteParticipants, 'remote-participants');
  room.participants.forEach(participant => {
    renderedParticipants.set(participant.sid, renderRemoteParticipant(participant, remoteParticipantsContainer, room, restCreds, shouldAutoAttach));
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', participant => {
    renderedParticipants.set(participant.sid, renderRemoteParticipant(participant, remoteParticipantsContainer, room, restCreds, shouldAutoAttach));
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
      // statReport.localVideoTrackStats, can have multiple entries for a local video tracks when simulcast is enabled.
      // fold them into single entry.
      const videoTrackStats = new Map<string, { trackId: Track.SID, trackSid: Track.SID, timestamp: number, bytesSent: number}>();
      statReport.localVideoTrackStats.forEach((trackStat: LocalVideoTrackStats) => {
        let track = videoTrackStats.get(trackStat.trackSid);
        if (track) {
          track.bytesSent += (trackStat.bytesSent || 0);
        } else {
          let { trackId, trackSid, bytesSent, timestamp } = trackStat;
          bytesSent = bytesSent || 0;
          videoTrackStats.set(trackStat.trackSid, { trackId, trackSid, bytesSent, timestamp });
        }
      });

      Array.from(videoTrackStats.values()).forEach(({ trackId, trackSid, bytesSent, timestamp }) => {
        updateTrackStats({ room, trackId, trackSid, bytesSent, timestamp });
      });

      statReport.localAudioTrackStats.forEach(({ trackId, trackSid, bytesSent, timestamp }) => {
        updateTrackStats({ room, trackId, trackSid, bytesSent, timestamp });
      });

      [
        statReport.remoteVideoTrackStats,
        statReport.remoteAudioTrackStats,
      ].forEach(trackStatArr => {
        trackStatArr.forEach((trackStat: RemoteAudioTrackStats | RemoteVideoTrackStats) => {
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
