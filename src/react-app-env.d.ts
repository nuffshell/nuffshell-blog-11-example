/// <reference types="react-scripts" />

declare module "three.interactive" {
  export class InteractionManager {
    constructor(
      renderer: THREE.Renderer,
      camera: THREE.Camera,
      canvas: HTMLCanvasElement
    );

    update(): void;

    add(object: THREE.Sprite): void;
  }
}
