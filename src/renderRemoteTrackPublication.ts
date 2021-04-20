import { createButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createLabeledStat, ILabeledStat } from './components/labeledstat';
import { log as log2 } from './components/log';
import { renderTrack } from './renderTrack';
import {
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  RemoteTrackPublication
} from 'twilio-video';
import { createHeader } from './createHeader';

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
    border: 'solid 1px black',
    resize: 'both',
    overflow: 'auto',
    'overflow-y': 'scroll',
    width: '300px',
  }
}
// Compile styles, apply plugins.
export const sheet = jss.createStyleSheet(style)
sheet.attach();


export type IRenderedRemoteTrackPublication = {
  setBytesReceived: (bytesReceived: number, timestamp: number) => void;
  trackPublication: RemoteTrackPublication;
  container: HTMLElement;
  stopRendering: () => void;
}

export function renderRemoteTrackPublication(trackPublication: RemoteTrackPublication, container: HTMLElement, autoAttach: boolean): IRenderedRemoteTrackPublication {
  const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
  container = createDiv(container, sheet.classes.publication, trackContainerId);
  createLabeledStat({ container, label: 'class' }).setText('RemoteTrackPublication');
  createLabeledStat({ container, label: 'kind' }).setText(trackPublication.kind);
  createLabeledStat({ container, label: 'trackSid' }).setText(trackPublication.trackSid);


  let renderedTrack: { stopRendering: any; trackContainer?: any; track?: any; updateStats?: () => void; } | null;
  let statBytes: ILabeledStat;

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

      const publisherPriority = createLabeledStat({ container: trackBytesDiv, label: 'publisher priority' });
      publisherPriority.setText(`${trackPublication.publishPriority}`);
      trackPublication.on('publishPriorityChanged', () => {
        publisherPriority.setText(`${trackPublication.publishPriority}`);
      });

      const switchOffState = createLabeledStat({
        container: trackBytesDiv,
        label: 'Switched',
        valueMapper: (text: string) => text === 'Off' ? sheet.classes.background_yellow : undefined
      });

      const updateSwitchOffState = () => switchOffState.setText(track.isSwitchedOff ? 'Off' : 'On');
      track.on('switchedOff', updateSwitchOffState);
      track.on('switchedOn', updateSwitchOffState);
      updateSwitchOffState();

      // buttons to set subscriber priority.
      const priority = createLabeledStat({ container: trackBytesDiv, label: 'subscriber priority' });
      priority.setText(`${track.priority}`);
      createButton('High', trackBytesDiv, () => {
        track.setPriority('high');
        priority.setText(`${track.priority}`);
      });
      createButton('Standard', trackBytesDiv, () => {
        track.setPriority('standard');
        priority.setText(`${track.priority}`);
      });
      createButton('Low', trackBytesDiv, () => {
        track.setPriority('low');
        priority.setText(`${track.priority}`);
      });
      createButton('Null', trackBytesDiv, () => {
        track.setPriority(null);
        priority.setText(`${track.priority}`);
      });

      const renderHint = createLabeledStat({ container: trackBytesDiv, label: 'renderHint' });
      renderHint.setText(`none`);
      const videoTrack = track as RemoteVideoTrack;
      createButton('switchOff', trackBytesDiv, () => {
        videoTrack.switchOff();
        renderHint.setText(`off`);
      });
      createButton('switchOn', trackBytesDiv, () => {
        videoTrack.switchOn();
        renderHint.setText(`on`);
      });
      createButton('160x120', trackBytesDiv, () => {
        const renderDimensions = { width:  160, height: 120 };
        videoTrack.setContentPreferences({ renderDimensions });
        renderHint.setText(`renderDimensions=160x120`);
      });
      createButton('1280x720', trackBytesDiv, () => {
        const renderDimensions = { width: 1280, height: 720 };
        videoTrack.setContentPreferences({ renderDimensions });
        renderHint.setText(`renderDimensions=1280x720`);
      });
    } else {
      console.warn('CanRender returned false for ', track);
    }
  }

  if (trackPublication.isSubscribed) {
    renderRemoteTrack();
  }

  trackPublication.on('subscribed', function (track) {
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
        const bps = round((bytesReceived - previousBytes) / (timeStamp - previousTime));
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
