import GIF from "gif.js";
import workerURL from "gif.js/dist/gif.worker.js?url";
// import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ImageItem = {
  name: string;
  url: string;    // Object URL
  file: File;
};

const FRAME_MS = 500; // 0.5秒

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const rafId = useRef<number | null>(null);
  const lastTick = useRef<number | null>(null);
  const accum = useRef(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const hasImages = images.length > 0;
  const current = useMemo(() => (hasImages ? images[index] : null), [images, index, hasImages]);

  const stop = useCallback(() => {
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (!hasImages) return;
    setPlaying(true);
  }, [hasImages]);

  const resetPlayback = useCallback(() => {
    stop();
    setIndex(0);
    accum.current = 0;
    lastTick.current = null;
  }, [stop]);

  // 再生ループ（requestAnimationFrame）
  useEffect(() => {
    if (!playing) {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      lastTick.current = null;
      return;
    }

    const loop = (t: number) => {
      if (lastTick.current == null) {
        lastTick.current = t;
      } else {
        const dt = t - lastTick.current;
        lastTick.current = t;
        accum.current += dt;

        while (accum.current >= FRAME_MS) {
          accum.current -= FRAME_MS;
          setIndex((prev) => (images.length ? (prev + 1) % images.length : 0));
        }
      }
      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [playing, images.length]);

  // フォルダ選択 → 画像読み込み
  const onPickFolder = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // 画像のみ・ファイル名昇順（数字も自然順序で並ぶように）
    const imgs = files
      .filter((f) => f.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      }));

    // 以前の ObjectURL を破棄
    setImages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return imgs;
    });

    // 先頭から再生準備
    setIndex(0);
    accum.current = 0;
    lastTick.current = null;
  }, []);

  // Gif 画像作成
  const exportGif = useCallback(async () => {
    if (!images.length || !stageRef.current) return;

    const side = Math.max(2, Math.round(stageRef.current.clientWidth));

    // 描画用キャンバス（正方形・黒背景に contain で配置）
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // gif.js 初期化（repeat=0: 無限ループ）
    const gif = new GIF({
      workers: 2,
      workerScript: workerURL,
      width: side,
      height: side,
      quality: 10,   // 1(最高)〜30(低)の目安。10は無難
      repeat: 0
    });

    for (const item of images) {
      // 黒でクリア
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, side, side);

      const bmp = await createImageBitmap(item.file);
      const scale = Math.min(side / bmp.width, side / bmp.height);
      const dw = Math.round(bmp.width * scale);
      const dh = Math.round(bmp.height * scale);
      const dx = Math.floor((side - dw) / 2);
      const dy = Math.floor((side - dh) / 2);
      ctx.drawImage(bmp, dx, dy, dw, dh);
      bmp.close();

      // キャンバスのピクセルをコピーしてフレーム追加
      gif.addFrame(ctx, {
        copy: true,     // その場でピクセルを取り込む（後で書き換えても影響しない）
        delay: 500,     // 0.5秒
        dispose: 2      // 次フレーム前に背景で消去（互換性が良い）
      });
    }

    gif.on("finished", (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flipbook.gif";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    gif.render();
  }, [images]);

  // アンマウント時に ObjectURL を掃除
  useEffect(() => {
    return () => {
      images.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [images]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Flipbook Viewer</h1>

      <div style={styles.controls}>
        <label style={styles.folderBtn}>
          📁 フォルダを選択
          <input
            type="file"
            // @ts-expect-error: webkitdirectory は型に無いが実ブラウザで動作
            webkitdirectory=""
            directory=""
            multiple
            accept="image/*"
            onChange={onPickFolder}
            style={{ display: "none" }}
          />
        </label>

        <button onClick={start} disabled={!hasImages || playing} style={styles.button}>
          ▶ 再生
        </button>
        <button onClick={stop} disabled={!playing} style={styles.button}>
          ⏸ 停止
        </button>
        <button onClick={resetPlayback} disabled={!hasImages} style={styles.button}>
          ↺ リセット
        </button>
        <button onClick={exportGif} disabled={!hasImages} style={styles.button}>
          🧩 GIFを書き出し
        </button>

        <span style={styles.info}>
          {hasImages ? `${index + 1} / ${images.length}  (${current?.name ?? ""})` : "画像未選択"}
        </span>
      </div>

      <div ref={stageRef} style={styles.stage}>
        {current ? (
          <img
            key={current.url}
            src={current.url}
            alt={current.name}
            style={styles.image}
            draggable={false}
          />
        ) : (
          <div style={styles.placeholder}>画像フォルダを選択してください</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 16 },
  title: { marginBottom: 12, fontSize: 22 },
  controls: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  folderBtn: {
    background: "#1f6feb",
    color: "white",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    userSelect: "none",
  },
  button: {
    background: "#e7eefc",
    border: "1px solid #c7d2fe",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
  },
  info: { marginLeft: 8, opacity: 0.8 },
  stage: {
    width: "min(90vw, 900px)",   // 幅の最大値
    aspectRatio: "1 / 1",        // 正方形に固定
    background: "#f6f8fa",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain", // 全体表示（余白あり）
    backgroundColor: "black", // 余白背景（任意）
    userSelect: "none",
    display: "block",
  },
  placeholder: { color: "#666" },
};
