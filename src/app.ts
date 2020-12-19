// import * as Video from 'twilio-video';
import Video from 'twilio-video';
import { demo } from './demo';

const css = require('./index.css');

/* eslint-disable no-console */
console.log('makarand: loaded src/app.ts');
console.log('makarand: Video:', Video.isSupported);
console.log('makarand: typeof Video:', typeof Video);
demo(Video, document.body);



