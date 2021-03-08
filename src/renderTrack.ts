import { waveform } from './components/waveform';
import { createButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createLabeledStat } from './components/labeledstat';
import { createTrackStats } from './createTrackStats';
import { AudioTrack, VideoTrack, RemoteVideoTrack, RemoteAudioTrack, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';

import jss from './jss'

// Create your style.
const style = {
  background_yellow: {
    background: 'yellow'
  },
  trackContainer: {
    border: 'solid 1px black',
    padding: '5px',
  },
  videoElement: {
    display: 'block',
    'max-width': '100% !important',
    'max-height': '80% !important'
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

/**
 * Attach the AudioTrack to the HTMLAudioElement and start the Waveform.
 */
export function attachAudioTrack(track: AudioTrack, container: HTMLElement) {
  const audioElement = container.appendChild(track.attach());
  const wave = waveform({ mediaStream: audioElement.srcObject as MediaStream, width: 200, height: 150 })
  const canvasContainer = createDiv(container, 'canvasContainer');
  canvasContainer.appendChild(wave.element);

  return {
    mediaElement: audioElement,
    stop: (): void => { wave.stop() }
  }
}

export function attachVideoTrack(track: VideoTrack, container: HTMLElement) {
  const videoElement = track.attach();
  videoElement.classList.add(sheet.classes.videoElement);
  container.appendChild(videoElement);
  return {
    mediaElement: videoElement,
    stop: (): void => {}
  }
}

// Attach the Track to the DOM.
export function renderTrack({ track, container, autoAttach } : {
  track: LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack,
  container: HTMLElement,
  autoAttach: boolean
}) {

  const trackContainer = createDiv(container, sheet.classes.trackContainer);
  const { updateStats } = createTrackStats(track, trackContainer);

  const controlContainer = createDiv(trackContainer, 'trackControls');

  createButton('update', controlContainer, () => updateStats());

  let mediaControls: HTMLElement | null = null;
  let stopMediaRender = () => {};
  const attachDetachBtn = createButton('attach', controlContainer, () => {
    if (mediaControls) {
      // track is already attached.
      track.detach().forEach(el => el.remove());
      mediaControls.remove();
      mediaControls = null;
      attachDetachBtn.text('attach');
    } else {
      // track is detached.
      mediaControls = createDiv(trackContainer, 'mediaControls');
      const mediaRenderer = track.kind === 'audio' ? attachAudioTrack(track, mediaControls): attachVideoTrack(track, mediaControls);
      const audioVideoElement = mediaRenderer.mediaElement;
      stopMediaRender = () => mediaRenderer.stop;

      createButton('pause', mediaControls, () => audioVideoElement?.pause());
      createButton('play', mediaControls, () => audioVideoElement?.play());
      createButton('update', mediaControls, () => updateMediaElementState());
      const isPlaying = createLabeledStat({
        container: mediaControls,
        label: 'playing',
        valueMapper: (text: string) => text === 'false' ? sheet.classes.background_yellow : undefined
      });
      const volume = createLabeledStat({
        container: mediaControls,
        label: 'volume'
      });
      // eslint-disable-next-line no-inner-declarations
      const updateMediaElementState = () => {
        isPlaying.setText(`${!audioVideoElement?.paused}`);
        volume.setText(`${audioVideoElement?.volume}`);
      }

      audioVideoElement.addEventListener('pause', () => updateMediaElementState());
      audioVideoElement.addEventListener('play', () => updateMediaElementState());
      attachDetachBtn.text('detach');
      updateMediaElementState();
    }
  });

  if (autoAttach) {
    attachDetachBtn.click();
  }
  updateStats();
  return {
    trackContainer,
    track,
    updateStats,
    stopRendering: () => {
      track.detach().forEach(element => element.remove());
      trackContainer.remove();
      stopMediaRender();
    }
  };
}


