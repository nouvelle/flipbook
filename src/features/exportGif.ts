import GIF from "gif.js";
import workerURL from "gif.js/dist/gif.worker.js?url";
import type { ImageItem, ExportOptions } from "../types";
import { loadDrawable, getSourceSize } from "../utils/image";

export function buildGif(
  images: ImageItem[],
  opts: ExportOptions,
  onProgress?: (p: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    let aborted = false;
    const onAbort = () => { aborted = true; cleanup(); reject(new DOMException("Aborted","AbortError")); };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });

    async function run() {
      try {
        const { side, frameMs, bgColor, quality, supersample = 1 } = opts;

        // 出力キャンバス（最終サイズ）
        const outCanvas = document.createElement("canvas");
        outCanvas.width = side; outCanvas.height = side;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) throw new Error("Canvas 2D context unavailable");
        outCtx.imageSmoothingEnabled = true;
        // @ts-ignore
        outCtx.imageSmoothingQuality = "high";

        // ワークキャンバス（高解像度で描く）
        const workSide = Math.max(1, Math.round(side * supersample));
        const workCanvas = document.createElement("canvas");
        workCanvas.width = workSide; workCanvas.height = workSide;
        const workCtx = workCanvas.getContext("2d")!;
        workCtx.imageSmoothingEnabled = true;
        // @ts-ignore
        workCtx.imageSmoothingQuality = "high";

        const gif = new GIF({
          workers: 2,
          workerScript: workerURL,
          width: side,           // GIF の最終サイズは side
          height: side,
          quality,               // 小さいほど高画質（3〜5 推奨）
          repeat: 0,
          background: bgColor,
        });
        if (onProgress) gif.on("progress", (p: number) => { if (!aborted) onProgress(p); });

        for (const item of images) {
          if (aborted) return;

          // 1) ワークキャンバスを背景でクリア
          workCtx.fillStyle = bgColor;
          workCtx.fillRect(0, 0, workSide, workSide);

          // 2) 高解像度 contain で描画
          const drawable = await loadDrawable(item.file);
          if (aborted) { drawable.close?.(); drawable.revoke?.(); return; }
          const src = drawable.source;
          const { width: sw, height: sh } = getSourceSize(src);
          const s = Math.min(workSide / sw, workSide / sh);
          const dw = Math.round(sw * s), dh = Math.round(sh * s);
          const dx = Math.floor((workSide - dw) / 2);
          const dy = Math.floor((workSide - dh) / 2);
          workCtx.drawImage(src as any, dx, dy, dw, dh);

          // 3) 最終サイズへ高品質ダウンサンプル
          outCtx.fillStyle = bgColor;
          outCtx.fillRect(0, 0, side, side);
          outCtx.drawImage(workCanvas, 0, 0, workSide, workSide, 0, 0, side, side);

          // 4) フレーム取り込み
          gif.addFrame(outCtx, { copy: true, delay: frameMs, dispose: 2 });

          drawable.close?.();
          drawable.revoke?.();
        }

        gif.on("finished", (blob) => { if (!aborted) { cleanup(); resolve(blob); } });
        gif.render();
      } catch (e) {
        if (!aborted) { cleanup(); reject(e as Error); }
      }
    }
    function cleanup() { signal?.removeEventListener("abort", onAbort); }
    run();
  });
}
