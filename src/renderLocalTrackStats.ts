import { LocalAudioTrackStats, LocalVideoTrackStats } from 'twilio-video';
import { createLabeledStat } from './components/labeledstat';
import jss from './jss'


// Create your style.
const style = {
  background_gray: {
    background: 'gray',
  },
  background_green: {
    background: 'lightgreen',
  },
  localTrackControls: {
    /* since it attaches to track container */
    /* does not need top border */
    'border-bottom': 'solid 1px black',
    'border-left': 'solid 1px black',
    'border-right': 'solid 1px black',
  },
  localTrackContainer: {
    resize: 'both',
    // border: 'solid 1px black',
    overflow: 'auto',
    'overflow-y': 'scroll',
    // padding: '5px',
    width: '300px'
  }
}

// Compile styles, apply plugins.
const sheet = jss.createStyleSheet(style)
sheet.attach();


type ISSRCRender = {
  ssrc: string;
  stopRendering: () => void;
  update: (trackStats: LocalAudioTrackStats|LocalVideoTrackStats) => void;
};

function renderSSRC(container: HTMLElement): ISSRCRender {
  let ssrc: string = "unknown";
  let previousTime = 0;
  let previousBytes = 0;
  const statDisplay = createLabeledStat({
    container,
    label: 'sent (kbps)',
    valueMapper: (text: string) => text === '0' ? sheet.classes.background_gray : sheet.classes.background_green
  });
  statDisplay.setText('0');

  function isVideoTrackStats(track: LocalAudioTrackStats|LocalVideoTrackStats): track is LocalVideoTrackStats {
    return 'dimensions' in track || 'frameRate' in track;
  }

  return {
    ssrc,
    stopRendering: () => {
      statDisplay.element.remove();
    },
    update:(trackStats: LocalAudioTrackStats|LocalVideoTrackStats) => {
      ssrc = trackStats.ssrc;
      if (isVideoTrackStats(trackStats)) {
        if (trackStats.dimensions !== null) {
          const { width, height } = trackStats.dimensions;
          const frameRate = trackStats.frameRate || 0;
          statDisplay.setLabel(`${width}x${height}x${frameRate}`);
        }
      }
      let newBytesSent = trackStats.bytesSent||0;
      let newTimestamp = trackStats.timestamp;
      const round = (num: number) => Math.round((num + Number.EPSILON) * 10) / 10;
      const kBitsPerSecond = round((newBytesSent - previousBytes) / (newTimestamp - previousTime)) * 10;
      statDisplay.setText(kBitsPerSecond.toString());
      previousTime = newTimestamp;
      previousBytes = newBytesSent;
    }
  };
}


export function renderLocalTrackStats(container: HTMLElement) {
  let ssrcDisplayMap: Map<string, ISSRCRender> = new Map();
  return {
    updateLocalTrackStats: (trackStats: LocalVideoTrackStats[]|LocalAudioTrackStats[]) => {
      trackStats.forEach(trackStat => {
        const ssrcRender = ssrcDisplayMap.get(trackStat.ssrc);
        if (ssrcRender) {
          ssrcRender.update(trackStat);
        } else {
          const ssrcRender = renderSSRC(container);
          ssrcRender.update(trackStat);
          ssrcDisplayMap.set(trackStat.ssrc, ssrcRender);
        }
      });
    },
    stopRendering:() => {
      ssrcDisplayMap.forEach(ssrcRenderer => ssrcRenderer.stopRendering());
      ssrcDisplayMap.clear();
    }
  }
}