import type { ImageBinary } from "../types";

export interface Drawable {
  source: CanvasImageSource;
  revoke?: () => void;
  close?: () => void;
}

// 画像読み込み：createImageBitmap が使えない環境や HEIC/HEIF でも安全に読み込む
export async function loadDrawable(file: ImageBinary): Promise<Drawable> {
  // Blob でも File でも OK
  try {
    const bmp = await createImageBitmap(file as Blob);
    return { source: bmp, close: () => { try { bmp.close(); } catch {} } };
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, revoke: () => URL.revokeObjectURL(url) };
  }
}

function hasNumericWH(o: unknown): o is { width: number; height: number } {
  return !!o && typeof (o as any).width === "number" && typeof (o as any).height === "number";
}

/** CanvasImageSource から幅・高さを安全に取り出す */
export function getSourceSize(src: CanvasImageSource): { width: number; height: number } {
  if (src instanceof HTMLImageElement) return { width: src.naturalWidth, height: src.naturalHeight };
  if (src instanceof HTMLCanvasElement) return { width: src.width, height: src.height };
  if (hasNumericWH(src)) return { width: (src as any).width, height: (src as any).height }; // ImageBitmap など
  return { width: 0, height: 0 };
}

/** 画像を最大辺 maxEdge に縮小し、指定形式で再圧縮して返す（元が小さければそのまま返す） */
export async function downscaleIfNeeded(
  file: File,
  maxEdge: number,
  format: "image/webp" | "image/jpeg" = "image/jpeg",
  quality = 0.85
): Promise<ImageBinary> {
  const drawable = await loadDrawable(file);
  const src = drawable.source;
  const { width: srcW, height: srcH } = getSourceSize(src);

  if (!srcW || !srcH || Math.max(srcW, srcH) <= maxEdge) {
    drawable.close?.(); drawable.revoke?.();
    return file;
  }

  const scale = maxEdge / Math.max(srcW, srcH);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { drawable.close?.(); drawable.revoke?.(); return file; }

  ctx.imageSmoothingEnabled = true;
  // @ts-ignore: 実装依存ですが多くのブラウザで有効
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), format, quality)
  );

  drawable.close?.(); drawable.revoke?.();
  return blob;
}
