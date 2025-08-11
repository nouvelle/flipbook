import GIF from "gif.js";
import workerURL from "gif.js/dist/gif.worker.js?url";
import type { ImageItem, ExportOptions } from "../types";
import { loadDrawable, getSourceSize } from "../utils/image";

// GIF 書き出し
export async function buildGif(images: ImageItem[], opts: ExportOptions): Promise<Blob> {
  const { side, frameMs, bgColor, quality } = opts;

  const canvas = document.createElement("canvas");
  canvas.width = side; canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const gif = new GIF({
    workers: 2,
    workerScript: workerURL,
    width: side,
    height: side,
    quality,
    repeat: 0,
    background: bgColor,
  });

  for (const item of images) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, side, side);

    const drawable = await loadDrawable(item.file);
    const src = drawable.source;
    const { width: srcW, height: srcH } = getSourceSize(src);
    const scale = Math.min(side / srcW, side / srcH);
    const dw = Math.round(srcW * scale);
    const dh = Math.round(srcH * scale);
    const dx = Math.floor((side - dw) / 2);
    const dy = Math.floor((side - dh) / 2);

    ctx.drawImage(src, dx, dy, dw, dh);
    gif.addFrame(ctx, { copy: true, delay: frameMs, dispose: 2 });

    drawable.close?.();
    drawable.revoke?.();
  }

  return new Promise<Blob>((resolve) => {
    gif.on("finished", (blob) => resolve(blob));
    gif.render();
  });
}
