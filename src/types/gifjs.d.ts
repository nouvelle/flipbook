declare module "gif.js" {
  export interface GIFOptions {
    workers?: number;
    workerScript?: string;
    width?: number;
    height?: number;
    quality?: number;  // 小さいほど高品質（デフォ10〜20くらいが無難）
    repeat?: number;   // 0: 無限ループ
    background?: string | number;
  }
  export interface FrameOptions {
    delay?: number;  // ms
    copy?: boolean;  // true 推奨（キャンバスのピクセルを即コピー）
    dispose?: 1 | 2 | 3; // 2: 背景で消去（互換性◎）
  }
  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(ctxOrCanvas: CanvasRenderingContext2D | HTMLCanvasElement | ImageData, options?: FrameOptions): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "progress", cb: (p: number) => void): void;
    render(): void;
  }
}
