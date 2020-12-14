export default function getContextFromCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('Failed to get 2D context from canvas');
  }
  return ctx;
}
