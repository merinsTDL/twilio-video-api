import { createDiv } from './components/createDiv';
import {
  RemoteParticipant,
  Track
} from 'twilio-video';
import { createHeader } from './createHeader';
import { IRenderedRemoteTrackPublication, renderRemoteTrackPublication } from "./renderRemoteTrackPublication";

export type IRenderedRemoteParticipant = {
  container: HTMLElement;
  updateStats: ({ trackSid, bytesReceived, timestamp } : { trackSid: string, bytesReceived: number, timestamp: number }) => void;
  stopRendering: () => void;
}

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
  publication: {
    padding: '5px'
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();


export function renderRemoteParticipant(participant: RemoteParticipant, container: HTMLElement, shouldAutoAttach: () => boolean): IRenderedRemoteParticipant {
  container = createDiv(container, sheet.classes.participantDiv, `participantContainer-${participant.identity}`);

  const participantName = createHeader({ container, text: participant.identity });
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
    updateStats: ({ trackSid, bytesReceived, timestamp }: { trackSid: string; bytesReceived: number; timestamp: number; }) => {
      renderedPublications.forEach((renderedTrackpublication: IRenderedRemoteTrackPublication, renderedTrackSid: Track.SID) => {
        if (trackSid === renderedTrackSid) {
          renderedTrackpublication.setBytesReceived(bytesReceived, timestamp);
        }
      });
    },
    stopRendering: () => {
      renderedPublications.forEach((renderedTrackpublication: IRenderedRemoteTrackPublication, renderedTrackSid: Track.SID) => {
        renderedTrackpublication.stopRendering();
        renderedPublications.delete(renderedTrackSid);
      });
      container.remove();
    }
  };
}
