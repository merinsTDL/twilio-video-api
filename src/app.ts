// import * as Video from 'twilio-video';
import Video from 'twilio-video';

// @ts-ignore
// import Video from 'twilio-video/dist/bundle.js' ;
import { demo } from './demo';

// @ts-ignore
console.log('accessing Twilio: ', Twilio);
// @ts-ignore
const cdn = Twilio.Video;
const npm = Video;
console.log({ cdn,  npm });
console.log('Using NPM');
demo(npm, document.body);



