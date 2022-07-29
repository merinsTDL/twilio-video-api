// import * as Video from 'twilio-video';
import Video from 'twilio-video';
import { demo } from './demo';


const npm = Video;
try {
  // @ts-ignore
  console.log('accessing CDN Twilio: ', Twilio);
  // @ts-ignore
  const cdn = Twilio.Video;
  console.log({ cdn,  npm });
} catch (error) {
  console.warn('Failed to load CDN version: ', error);
}

// use npm version of twilio-video.
demo(npm, document.body);



