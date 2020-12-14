/// <reference types="react-scripts" />

declare module '*.css' {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

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
