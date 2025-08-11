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
    const abortErr = () => new DOMException("Aborted", "AbortError");

    const onAbort = () => { aborted = true; cleanup(); reject(abortErr()); };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });

    async function run() {
      try {
        const { side, frameMs, bgColor, quality } = opts;
        const canvas = document.createElement("canvas");
        canvas.width = side; canvas.height = side;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable");

        const gif = new GIF({ workers: 2, workerScript: workerURL, width: side, height: side, quality, repeat: 0, background: bgColor });
        if (onProgress) gif.on("progress", (p: number) => { if (!aborted) onProgress(p); });

        for (const item of images) {
          if (aborted) return; // onAbortでreject済み
          ctx.fillStyle = bgColor; ctx.fillRect(0, 0, side, side);

          const drawable = await loadDrawable(item.file);
          if (aborted) { drawable.close?.(); drawable.revoke?.(); return; }

          const src = drawable.source;
          const { width: sw, height: sh } = getSourceSize(src);
          const s = Math.min(side / sw, side / sh);
          const dw = Math.round(sw * s), dh = Math.round(sh * s);
          const dx = (side - dw) >> 1, dy = (side - dh) >> 1;

          ctx.drawImage(src, dx, dy, dw, dh);
          gif.addFrame(ctx, { copy: true, delay: frameMs, dispose: 2 });

          drawable.close?.(); drawable.revoke?.();
        }
        if (aborted) return;

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

