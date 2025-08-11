#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// ---- CLI引数 ----
const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/generate-icons.mjs <sourceImage> [--out public/icons] [--bg #1f6feb] [--padding 0.12]");
  process.exit(1);
}
const args = Object.fromEntries(
  process.argv.slice(3).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1]]);
    return acc;
  }, [])
);

const outDir = args.out ?? "public/icons";
const bg = parseColor(args.bg ?? "#1f6feb");      // maskable 背景
const padding = clamp(parseFloat(args.padding ?? "0.12"), 0, 0.4); // maskable 余白率（0〜0.4目安）

await fs.mkdir(outDir, { recursive: true });

// ---- 出力定義 ----
const regularSizes = [192, 512];            // manifest icons (any)
const maskableSizes = [192, 512];           // manifest icons (maskable)
const favSizes = [16, 32];                  // favicon
const appleSize = 180;                      // apple-touch-icon

// 便利: 256/384も欲しければここに追加
// const regularSizes = [192, 256, 384, 512];

console.log(`Generating icons from ${input}`);
console.log(` -> out: ${outDir}, bg: ${toHex(bg)}, padding: ${padding}`);

// ---- 通常アイコン（透明背景、クロップなし=contain）----
await Promise.all(
  regularSizes.map((size) =>
    sharp(input)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`))
  )
);

// ---- maskable アイコン（背景色ベタ塗り + 中央に縮小配置）----
for (const size of maskableSizes) {
  const inner = Math.round(size * (1 - padding * 2));
  const content = await sharp(input).resize(inner, inner, { fit: "contain" }).png().toBuffer();
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  });
  await base
    .composite([{ input: content, left: Math.round(size * padding), top: Math.round(size * padding) }])
    .png()
    .toFile(path.join(outDir, `maskable-${size}.png`));
}

// ---- favicon （透明背景、16/32）----
await Promise.all(
  favSizes.map((size) =>
    sharp(input)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join("public", `favicon-${size}x${size}.png`))
  )
);

// ---- Apple Touch Icon（背景必須っぽいのでベタ塗り）----
{
  const size = appleSize;
  const inner = Math.round(size * 0.84); // iOSは角丸が入るので少し余白広め
  const content = await sharp(input).resize(inner, inner, { fit: "contain" }).png().toBuffer();
  const base = sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  });
  await base
    .composite([{ input: content, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toFile(path.join("public", "apple-touch-icon.png"));
}

console.log("Done ✅");

// ---- helpers ----
function clamp(n, min, max) { return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min)); }
function parseColor(hex) {
  const m = String(hex).trim().replace("#", "");
  if (m.length === 3) {
    const r = parseInt(m[0] + m[0], 16), g = parseInt(m[1] + m[1], 16), b = parseInt(m[2] + m[2], 16);
    return { r, g, b, alpha: 1 };
  }
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return { r, g, b, alpha: 1 };
}
function toHex({ r, g, b }) { return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`; }
