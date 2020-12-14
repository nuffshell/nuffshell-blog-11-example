/// <reference types="react-scripts" />

declare module '*.css' {
  interface IClassNames {
    [className: string]: string;
  }
  const classNames: IClassNames;
  export = classNames;
}

declare module 'three.interactive' {
  export const InteractionManager: any;
}
