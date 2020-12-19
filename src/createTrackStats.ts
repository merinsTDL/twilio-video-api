import { AudioTrack, VideoTrack } from 'twilio-video';
import { createDiv } from './components/createDiv';
import { ILabeledStat, createLabeledStat } from './components/labeledstat';

export function createTrackStats(track: AudioTrack | VideoTrack, container: HTMLElement) {
  container = createDiv(container, 'trackStats');

  function isVideoTrack(track: AudioTrack | VideoTrack): track is VideoTrack {
    return track.kind === 'video';
  }

  createLabeledStat({ container, label: 'kind', className: 'trackKind',  useValueToStyle: true}).setText(track.kind);
  const readyState = createLabeledStat({ container, label: 'readyState', className: 'readyState', useValueToStyle: true});
  const enabled = createLabeledStat({ container, label: 'enabled', className: 'enabled', useValueToStyle: true});
  const muted = createLabeledStat({ container, label: 'muted', className: 'muted', useValueToStyle: true});

  let dimensions: ILabeledStat;
  if (isVideoTrack(track)) {
    dimensions = createLabeledStat({ container, label: 'dimensions', className: 'dimensions' });
    track.on('dimensionsChanged', () => updateStats());
  }

  const started = createLabeledStat({ container, label: 'Track.started', className: 'started', useValueToStyle: true });
  const trackEnabled = createLabeledStat({ container, label: 'Track.enabled', className: 'enabled', useValueToStyle: true });

  function listenOnMSTrack(msTrack: MediaStreamTrack) {
    msTrack.addEventListener('ended', () => updateStats());
    msTrack.addEventListener('mute', () => updateStats());
    msTrack.addEventListener('unmute', () => updateStats());
  }

  track.on('disabled', () => updateStats());
  track.on('enabled', () => updateStats());
  track.on('stopped', () => updateStats());
  track.on('started', () => {
    updateStats();
    listenOnMSTrack(track.mediaStreamTrack);
  });

  function updateStats() {
    readyState.setText(track.mediaStreamTrack.readyState);
    enabled.setText(`${track.mediaStreamTrack.enabled}`);
    started.setText(`${track.isStarted}`);
    muted.setText(`${track.mediaStreamTrack.muted}`);
    trackEnabled.setText(`${track.isEnabled}`);

    if (isVideoTrack(track)) {
      const { width, height } = track.dimensions;
      dimensions.setText(`w${width} x h${height}`);
    }
  }

  return { updateStats };
}
