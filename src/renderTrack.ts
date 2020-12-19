import { Waveform } from './old_jsutilmodules/waveform.js';
import { createButton } from './components/button';
import { createDiv } from './components/createDiv';
import { createLabeledStat } from './components/labeledstat';
import { createTrackStats } from './createTrackStats';
import { AudioTrack, RemoteVideoTrack, RemoteAudioTrack, LocalAudioTrack, LocalVideoTrack } from 'twilio-video';


/**
 * Attach the AudioTrack to the HTMLAudioElement and start the Waveform.
 */
export function attachAudioTrack(track: AudioTrack, container: HTMLElement) {
  const audioElement = container.appendChild(track.attach());
  const waveform = new Waveform();
  waveform.setStream(audioElement.srcObject as MediaStream);
  const canvasContainer = createDiv(container, 'canvasContainer');

  // @ts-ignore
  canvasContainer.appendChild(waveform.element);
  return audioElement;
}

// Attach the Track to the DOM.
export function renderTrack({ track, container, autoAttach } : {
  track: LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack,
  container: HTMLElement,
  autoAttach: boolean
}) {

  // @ts-ignore
  const trackContainerId = track.sid || track.id;
  const trackContainer = createDiv(container, 'trackContainer', trackContainerId);
  const { updateStats } = createTrackStats(track, trackContainer);

  const controlContainer = createDiv(trackContainer, 'trackControls');

  createButton('update', controlContainer, () => updateStats());
  // createButton('setPriority High', controlContainer, () => {
  //   track.setPriority('low');
  // });

  let mediaControls: HTMLElement | null = null;
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
      let audioVideoElement: HTMLMediaElement | null = null;
      if (track.kind === 'audio') {
        audioVideoElement = attachAudioTrack(track, mediaControls);
      } else {
        audioVideoElement = track.attach();
        mediaControls.appendChild(audioVideoElement);
      }
      createButton('pause', mediaControls, () => audioVideoElement?.pause());
      createButton('play', mediaControls, () => audioVideoElement?.play());
      createButton('update', mediaControls, () => updateMediaElementState());
      const isPlaying = createLabeledStat({ container: mediaControls, label: 'playing', className: 'enabled', useValueToStyle: true });
      const volume = createLabeledStat({ container: mediaControls, label: 'volume', className: 'bytes', useValueToStyle: true });
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
    }
  };
}


