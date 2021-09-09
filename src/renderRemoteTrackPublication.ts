import { createDiv } from './components/createDiv';
import { createLabeledStat } from './components/labeledstat';
import { log as log2 } from './components/log';
import {
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  RemoteTrackPublication
} from 'twilio-video';

import { IRenderedRemoteMediaTrack, renderRemoteMediaTrack } from './renderRemoteMediaTrack';

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
  publication: {
    border: 'solid 1px black',
    resize: 'both',
    overflow: 'auto',
    'overflow-y': 'scroll',
    width: '300px',
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();


export type IRenderedRemoteTrackPublication = {
  setBytesReceived: (bytesReceived: number, timestamp: number) => void;
  setFPS: (fps: number) => void;
  setAudioLevel: (audioLevel: number) => void;
  trackPublication: RemoteTrackPublication;
  container: HTMLElement;
  stopRendering: () => void;
}

export function renderRemoteTrackPublication(trackPublication: RemoteTrackPublication, container: HTMLElement, autoAttach: boolean): IRenderedRemoteTrackPublication {
  const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
  container = createDiv(container, sheet.classes.publication, trackContainerId);
  createLabeledStat({ container, label: `${trackPublication.kind} publication` }).setText(trackPublication.trackSid);

  let renderedTrack: IRenderedRemoteMediaTrack | null;
  function canRenderTrack(track: any): track is LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack {
    return track;
  }

  function renderRemoteDataTrack() {
    const track = trackPublication.track;
    track?.on('message', message => {
      console.log(JSON.parse(message as string)); // { x: <number>, y: <number> }
    });
  }

  function renderRemoteTrack() {
    const track = trackPublication.track;
    if (trackPublication.kind === 'data') {
      renderRemoteDataTrack();
    } else {
      if (canRenderTrack(track)) {
        renderedTrack = renderRemoteMediaTrack(track, trackPublication, container, autoAttach);
      } else {
        console.warn('CanRender returned false for ', track);
      }
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

  return {
    setBytesReceived: (bytesReceived: number, timeStamp: number) => {
      if (renderedTrack) {
        renderedTrack.setBytesReceived(bytesReceived, timeStamp);
      }
    },
    setFPS: (fps: number) => {
      if (renderedTrack) {
        renderedTrack.setFPS(fps);
      }
    },
    setAudioLevel: (audioLevel: number) => {
      if (renderedTrack) {
        renderedTrack.setAudioLevel(audioLevel);
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
