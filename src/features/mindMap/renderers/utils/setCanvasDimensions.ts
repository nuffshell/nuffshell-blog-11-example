import getContextFromCanvas from './getContextFromCanvas';

export default function setCanvasDimensions(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  set2dTransform = false
) {
  const ratio = Math.ceil(window.devicePixelRatio);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (set2dTransform) {
    const ctx = getContextFromCanvas(canvas);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}
