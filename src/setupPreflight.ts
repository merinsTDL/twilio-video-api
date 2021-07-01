import { createButton } from './components/button';
import { PreflightTest, PreflightTestReport } from 'twilio-video';
import { renderLocalTrack } from './renderLocalTrack';

export function setupPreflight({ container, token, Video, environment, trackContainer, renderLocalTrack } :
  {
    container: HTMLDivElement,
    token: string,
    Video: typeof import('twilio-video'),
    trackContainer: HTMLDivElement,
    environment: string
    renderLocalTrack: (track: MediaStreamTrack) => void
  }) {
  const runPreflight = Video.runPreflight;
  let preflightTest: PreflightTest | null = null;
  const flightBtn = createButton('runPreflight', container, async () => {
    if (preflightTest) {
      // stop on going preflight test
      preflightTest.stop();
      flightBtn.text('runPreflight');
    } else {
      flightBtn.text('stop');
      const logger = Video.Logger.getLogger('twilio-video');
      logger.setLevel('DEBUG');
      console.log('starting runPreflight');
      preflightTest = runPreflight(token, { duration: 10000, environment });
      const deferred: { reject?: (e: Error) => void; resolve?: (report: any) => void; promise?: Promise<any>; } = {};
      deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });

      preflightTest.on('progress', (progress: string) => {
        console.log('preflight progress:', progress);
      });

      preflightTest.on('failed', (error: Error) => {
        console.error('preflight error:', error);
        deferred.reject && deferred.reject(error);
      });

      preflightTest.on('completed', (report: PreflightTestReport) => {
        console.log('preflight completed:', JSON.stringify(report, null, 4));
        deferred.resolve && deferred.resolve(report);
      });

      // @ts-ignore
      preflightTest.on('debug', payload => {
        if (payload.remoteTracks) {
          console.log('got debug tracks', payload.remoteTracks);
          payload.remoteTracks.forEach((track: MediaStreamTrack) => {
            const msTrack = track as MediaStreamTrack;
            const localTrack = msTrack.kind === 'video' ?
              new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: 'my-video' }) :
              new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: 'my-audio' });
            renderLocalTrack(msTrack);
          });
        }
      });
      await deferred.promise;
    }
  });
}
