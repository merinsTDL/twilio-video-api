import { RemoteAudioTrack, RemoteTrackPublication, RemoteVideoTrack } from '../../../work/twilio-video.js/tsdef';
import { createButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createLabeledStat, ILabeledStat } from './components/labeledstat';
import { renderTrack } from './renderTrack';

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
  remoteTrackControls: {
    /* since it attaches to track container */
    /* does not need top border */
    'border-bottom': 'solid 1px black',
    'border-left': 'solid 1px black',
    'border-right': 'solid 1px black',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

export type IRenderedRemoteMediaTrack = {
  setBytesReceived: (bytesReceived: number, timestamp: number) => void;
  setFPS: (fps: number) => void;
  setAudioLevel: (audioLevel: number) => void;
  stopRendering: () => void;
}

export function renderRemoteMediaTrack(track: RemoteAudioTrack | RemoteVideoTrack, trackPublication: RemoteTrackPublication, container: HTMLElement, autoAttach: boolean): IRenderedRemoteMediaTrack {
  let trackFPS: ILabeledStat;
  let trackAudioLevel: ILabeledStat;
  const videoTrack = track.kind === 'video' ? track as RemoteVideoTrack : null;
  const renderedTrack = renderTrack({ track, container, autoAttach });
  const trackBytesDiv = createDiv(container, sheet.classes.remoteTrackControls, 'remoteTrackControls');
  const statBytes = createLabeledStat({
    container: trackBytesDiv,
    label: 'received kbps',
    valueMapper: (text: string) => text === '0' ? sheet.classes.background_yellow : undefined
  });
  statBytes.setText('0');
  if (videoTrack) {
    trackFPS = createLabeledStat({
      container: trackBytesDiv,
      label: 'fps',
      valueMapper: (text: string) => text === '0' ? sheet.classes.background_yellow : undefined
    });
  } else {
    trackAudioLevel = createLabeledStat({
      container: trackBytesDiv,
      label: 'audioLevel',
      valueMapper: (text: string) => text === '0' ? sheet.classes.background_yellow : undefined
    });
  }

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

  if (videoTrack) {
    const renderHint = createLabeledStat({ container: trackBytesDiv, label: 'renderHint' });
    renderHint.setText(`none`);
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
  }

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
    setFPS: (fps: number) => {
      trackFPS.setText(fps.toString());
    },
    setAudioLevel: (audioLevel: number) => {
      trackAudioLevel.setText(audioLevel.toString());
    },
    stopRendering: () => {
      renderedTrack.stopRendering();
      trackBytesDiv.remove();
    }
  };
}
