import { appConfigVar } from '../../../../storage/appConfig';

export default function animate(callback: () => void) {
  function loop() {
    const { isPaused } = appConfigVar();
    if (!isPaused) {
      callback();
    }
    requestAnimationFrame(loop);
  }
  setTimeout(loop);
}
