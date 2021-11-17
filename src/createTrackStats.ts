import { sheets } from 'jss';
import { AudioTrack, LocalAudioTrack, LocalVideoTrack, RemoteAudioTrack, RemoteVideoTrack, VideoTrack } from 'twilio-video';
import { createCollapsibleDiv } from './components/createCollapsibleDiv';
import { createDiv } from './components/createDiv';
import { createElement } from './components/createElement';
import { ILabeledStat, createLabeledStat } from './components/labeledstat';
import jss from './jss'

// Create your style.
const style = {
  background_red: {
    background: 'red',
  },
  background_green: {
    background: 'lightgreen',
  },
  background_yellow: {
    background: 'yellow',
  },
  audioTrack: {
    background: 'lightcoral',
  },
  videoTrack: {
    background: 'lightblue'
  }
}
// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();

type functionReturningString = () => string;
type stringOrFn = string|functionReturningString;


function getClass(track: LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack) {
  if (track instanceof LocalAudioTrack) {
    return 'LocalAudioTrack'
  } else if (track instanceof LocalVideoTrack) {
    return 'LocalVideoTrack'
  } else if (track.kind === 'audio') {
    return 'RemoteAudioTrack';
  } else if (track.kind === 'video') {
    return 'RemoteVideoTrack';
  } else {
    return 'unknown';
  }
}

export function createTrackStats(track: LocalAudioTrack | LocalVideoTrack | RemoteAudioTrack | RemoteVideoTrack, container: HTMLElement) {
  let outerDiv: HTMLFieldSetElement;
  ({ innerDiv: container, outerDiv } = createCollapsibleDiv({ container, headerText: 'Track Details', startHidden: true, divClass: [] }));
  // container = createDiv(container, 'trackStats');

  function isVideoTrack(track: AudioTrack | VideoTrack): track is VideoTrack {
    return track.kind === 'video';
  }

  createLabeledStat({
    container,
    label: 'class'
  }).setText(getClass(track));

  const readyState = createLabeledStat({
    container,
    label: 'readyState',
    valueMapper: (text: string) => text === 'ended' ? sheet.classes.background_red : undefined
  });

  const enabled = createLabeledStat({
    container,
    label: 'enabled',
    valueMapper: (text: string) => text === 'false' ? sheet.classes.background_yellow : undefined
  });

  const muted = createLabeledStat({
    container,
    label: 'muted',
    valueMapper: (text: string) => text === 'true' ? sheet.classes.background_yellow : undefined
  });

  const started = createLabeledStat({
    container,
    label: 'Track.started',
    valueMapper: (text: string) => text === 'false' ? sheet.classes.background_yellow : undefined
  });

  const trackEnabled = createLabeledStat({
    container,
    label: 'Track.enabled',
    valueMapper: (text: string) => text === 'false' ? sheet.classes.background_yellow : undefined
  });

  // line separator between settings
  createElement({ container, type: 'hr'});

  const trackSettingKeyToLabeledStat = new Map<string, ILabeledStat>();
  function updateTrackSettings() {
    const trackSettings = track.mediaStreamTrack.getSettings();
    const keys = Object.keys(trackSettings);
    keys.forEach(key => {
      // exclude big settings
      if (!['deviceId', 'groupId'].includes(key)) {
        let settingStat = trackSettingKeyToLabeledStat.get(key);
        if (!settingStat) {
          settingStat = createLabeledStat({
            container,
            label: key,
            valueMapper: (text: string) => text === 'true' ? sheet.classes.background_yellow : undefined
          });
          trackSettingKeyToLabeledStat.set(key, settingStat);
        }
        let statValue = trackSettings[key as keyof MediaTrackSettings];
        if (typeof statValue === 'number') {
          statValue = Math.round(statValue * 100) / 100;
        }
        settingStat.setText(String(statValue));
      }
    });
  }

  function listenOnMSTrack(msTrack: MediaStreamTrack) {
    msTrack.addEventListener('ended', () => updateStats());
    msTrack.addEventListener('mute', () => updateStats());
    msTrack.addEventListener('unmute', () => updateStats());
  }

  track.on('dimensionsChanged', () => updateStats());
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
    updateTrackSettings();
  }

  return { updateStats };
}



