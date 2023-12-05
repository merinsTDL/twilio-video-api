interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

export function syntheticVideo({ width = 640, height = 480, word = 'hello' } = {}) {

  const canvas = Object.assign(
    document.createElement('canvas'), { width, height }
  ) as CanvasElement;

  const video = Object.assign(
    document.createElement('video'), { width, height }
  ) as HTMLVideoElement;

  let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;


  ctx.fillStyle = 'green';
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  // ctx.drawImage(video, 0, 0, video.width, video.height);
  // const wordWidth = ctx.measureText(word).width;
  let r = 0;
  let i = 0;
  let stopped = false;
  video.src = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  video.play();

function animate() {
    // r += Math.PI / 180;
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.save();
    // ctx.translate(canvas.width / 2, canvas.height / 2);
    // ctx.rotate(r);
    // ctx.font = '30px Verdana';
    // ctx.textAlign = 'center';
    // ctx.fillText(`${word}-${i}`, 0, 0);
    // i++;
    // ctx.restore();

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    window.requestAnimationFrame(animate);
    ctx.restore();
  }

  requestAnimationFrame(animate);

  const stream = canvas.captureStream(10);
  const track =  stream.getTracks()[0];
  const originalStop = track.stop;
  track.stop = () => {
    stopped = true;
    video.pause();

    originalStop.call(track);
  };
  return track;
}
