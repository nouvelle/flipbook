declare module "gif.js" {
  export interface GIFOptions {
    workers?: number;
    workerScript?: string;
    width?: number;
    height?: number;
    quality?: number;
    repeat?: number;
    background?: string | number;
  }
  export interface FrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: 1 | 2 | 3;
  }
  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(ctxOrCanvas: CanvasRenderingContext2D | HTMLCanvasElement | ImageData, options?: FrameOptions): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "progress", cb: (p: number) => void): void;
    render(): void;
  }
}
