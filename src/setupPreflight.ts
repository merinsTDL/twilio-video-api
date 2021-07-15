import { createButton } from './components/button';
import { log } from './components/log';
import { PreflightTest, PreflightTestReport } from 'twilio-video';

export function setupPreflight({ container, token, Video, environment, renderMSTrack } :
  {
    container: HTMLDivElement,
    token: string,
    Video: typeof import('twilio-video'),
    environment: string
    renderMSTrack: (track: MediaStreamTrack) => void
  }) {
  const runPreflight = Video.runPreflight;
  let preflightTest: PreflightTest | null = null;
  const flightBtn = createButton('runPreflight', container, async () => {
    if (preflightTest) {
      // stop on going preflight test
      preflightTest.stop();
      flightBtn.text('runPreflight');
      preflightTest = null;
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
        log('preflight progress:', progress);
      });

      preflightTest.on('failed', (error: Error) => {
        log('preflight error:', error);
        console.error('preflight error:', error);
        deferred.reject && deferred.reject(error);
      });

      preflightTest.on('completed', (report: PreflightTestReport) => {
        log("Test completed in " + report.testTiming.duration + " milliseconds.");
        log(" It took " + report.networkTiming.connect?.duration + " milliseconds to connect");
        log(" It took " + report.networkTiming.media?.duration + " milliseconds to receive media");
        log(" makarand Your quality score was " + report.qualityScore);
        log('preflight completed:', report);
        deferred.resolve && deferred.resolve(report);
      });

      // @ts-ignore
      preflightTest.on('debug', payload => {
        if (payload.localTracks) {
          console.log('got debug localTracks:', payload.localTracks);
          payload.localTracks.forEach((track: MediaStreamTrack) => {
            const msTrack = track as MediaStreamTrack;
            renderMSTrack(msTrack);
          });
        }

        if (payload.remoteTracks) {
          console.log('got debug remoteTracks:', payload.remoteTracks);
          payload.remoteTracks.forEach((track: MediaStreamTrack) => {
            const msTrack = track as MediaStreamTrack;
            renderMSTrack(msTrack);
          });
        }
      });
      await deferred.promise;
    }
  });
}
