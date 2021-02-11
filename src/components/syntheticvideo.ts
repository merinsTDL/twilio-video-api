interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

export function syntheticVideo({ width = 640, height = 480, word = 'hello' } = {}) {

  const canvas = Object.assign(
    document.createElement('canvas'), { width, height }
  ) as CanvasElement;

  let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = 'green';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // const wordWidth = ctx.measureText(word).width;
  let r = 0;
  let i = 0;
  requestAnimationFrame(function animate() {
    r += Math.PI / 180;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(r);
    ctx.font = '30px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText(`${word}-${i}`, 0, 0);
    i++;
    ctx.restore();
    requestAnimationFrame(animate);
  });
  const stream = canvas.captureStream(10);
  return stream.getTracks()[0];
}
