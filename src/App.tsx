import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GIF from "gif.js";
import workerURL from "gif.js/dist/gif.worker.js?url";

type ImageItem = {
  name: string;
  url: string;
  file: File;
};

type SizePreset = "stage" | 256 | 512 | 720;

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // 追加オプション
  const [frameMs, setFrameMs] = useState<number>(500);            // プレビュー＆書き出しのフレーム間隔
  const [sizePreset, setSizePreset] = useState<SizePreset>("stage"); // 出力サイズ
  const [customSize, setCustomSize] = useState<number>(640);      // カスタム時の一辺(px)
  const [bgColor, setBgColor] = useState<string>("#000000");      // 背景色（黒）
  const [quality, setQuality] = useState<number>(10);             // 1(最高)〜30(低)

  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);
  const lastTick = useRef<number | null>(null);
  const accum = useRef(0);

  const hasImages = images.length > 0;
  const current = useMemo(() => (hasImages ? images[index] : null), [images, index, hasImages]);

  const stop = useCallback(() => setPlaying(false), []);
  const start = useCallback(() => { if (hasImages) setPlaying(true); }, [hasImages]);
  const resetPlayback = useCallback(() => {
    stop(); setIndex(0); accum.current = 0; lastTick.current = null;
  }, [stop]);

  // 再生ループ
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
        while (accum.current >= frameMs) {
          accum.current -= frameMs;
          setIndex((prev) => (images.length ? (prev + 1) % images.length : 0));
        }
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => { if (rafId.current != null) cancelAnimationFrame(rafId.current); rafId.current = null; };
  }, [playing, images.length, frameMs]);

  // フォルダ読み込み
  const onPickFolder = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const imgs = files
      .filter((f) => f.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
      .map((file) => ({ name: file.name, url: URL.createObjectURL(file), file }));
    setImages((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.url)); return imgs; });
    setIndex(0); accum.current = 0; lastTick.current = null;
  }, []);

  // 後片付け
  useEffect(() => () => { images.forEach((p) => URL.revokeObjectURL(p.url)); }, [images]);

  // GIF 書き出し
  const exportGif = useCallback(async () => {
    if (!images.length || !stageRef.current) return;

    const stageSide = Math.round(stageRef.current.clientWidth);
    const side =
      sizePreset === "stage" ? stageSide :
      typeof sizePreset === "number" ? sizePreset :
      customSize;

    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gif = new GIF({
      workers: 2,
      workerScript: workerURL,
      width: side,
      height: side,
      quality,
      repeat: 0,
      // background を指定すると一部ビューワの互換性が良くなることがあります
      background: bgColor
    });

    for (const item of images) {
      // 背景でクリア
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, side, side);

      const bmp = await createImageBitmap(item.file);
      const scale = Math.min(side / bmp.width, side / bmp.height);
      const dw = Math.round(bmp.width * scale);
      const dh = Math.round(bmp.height * scale);
      const dx = Math.floor((side - dw) / 2);
      const dy = Math.floor((side - dh) / 2);
      ctx.drawImage(bmp, dx, dy, dw, dh);
      bmp.close();

      gif.addFrame(ctx, { copy: true, delay: frameMs, dispose: 2 });
    }

    gif.on("finished", (blob) => {
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
  }, [images, sizePreset, customSize, bgColor, quality, frameMs]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Flipbook Viewer</h1>

      <div style={styles.controls}>
        <label style={styles.folderBtn}>
          📁 フォルダを選択
          <input
            type="file"
            // @ts-expect-error: webkitdirectory は型定義に無い
            webkitdirectory=""
            directory=""
            multiple
            accept="image/*"
            onChange={onPickFolder}
            style={{ display: "none" }}
          />
        </label>

        <button onClick={start} disabled={!hasImages || playing} style={styles.button}>▶ 再生</button>
        <button onClick={stop} disabled={!playing} style={styles.button}>⏸ 停止</button>
        <button onClick={resetPlayback} disabled={!hasImages} style={styles.button}>↺ リセット</button>

        <span style={styles.info}>
          {hasImages ? `${index + 1} / ${images.length} (${current?.name ?? ""})` : "画像未選択"}
        </span>
      </div>

      {/* 設定パネル */}
      <div style={styles.panel}>
        <div style={styles.field}>
          <label>フレーム間隔（ms）</label>
          <input
            type="number"
            min={50}
            max={5000}
            step={50}
            value={frameMs}
            onChange={(e) => setFrameMs(Math.max(50, Math.min(5000, Number(e.target.value) || 500)))}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>書き出しサイズ</label>
          <select
            value={String(sizePreset)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "stage") setSizePreset("stage");
              else if (v === "custom") setSizePreset("stage"); // 後のカスタム欄で上書きする想定
              else setSizePreset(Number(v) as SizePreset);
            }}
            style={styles.select}
          >
            <option value="stage">ステージサイズ（現在の表示）</option>
            <option value="256">256 × 256</option>
            <option value="512">512 × 512</option>
            <option value="720">720 × 720</option>
          </select>
          <span style={{ marginLeft: 8 }}>カスタム：</span>
          <input
            type="number"
            min={64}
            max={2048}
            step={32}
            value={customSize}
            onChange={(e) => setCustomSize(Math.max(64, Math.min(2048, Number(e.target.value) || 640)))}
            style={{ ...styles.input, width: 100 }}
          />
          <span> px</span>
        </div>

        <div style={styles.field}>
          <label>背景色</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={styles.color} />
        </div>

        <div style={styles.field}>
          <label>品質（1=高品質, 30=低）</label>
          <input
            type="number"
            min={1}
            max={30}
            step={1}
            value={quality}
            onChange={(e) => setQuality(Math.max(1, Math.min(30, Number(e.target.value) || 10)))}
            style={{ ...styles.input, width: 80 }}
          />
        </div>

        <button onClick={exportGif} disabled={!hasImages} style={{ ...styles.button, fontWeight: 600 }}>
          🧩 GIFを書き出し
        </button>
      </div>

      <div ref={stageRef} style={styles.stage}>
        {current ? (
          <img key={current.url} src={current.url} alt={current.name} style={styles.image} draggable={false} />
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
  folderBtn: { background: "#1f6feb", color: "white", borderRadius: 8, padding: "8px 12px", cursor: "pointer", userSelect: "none" },
  button: { background: "#e7eefc", border: "1px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
  info: { marginLeft: 8, opacity: 0.8 },

  panel: { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", alignItems: "center", marginBottom: 12 },
  field: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  input: { padding: "6px 8px", borderRadius: 8, border: "1px solid #d1d5db" },
  select: { padding: "6px 8px", borderRadius: 8, border: "1px solid #d1d5db" },
  color: { width: 40, height: 32, padding: 0, border: "1px solid #d1d5db", borderRadius: 6 },

  stage: {
    width: "min(90vw, 900px)",
    aspectRatio: "1 / 1",        // 正方形
    background: "#f6f8fa",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", objectFit: "contain", backgroundColor: "black", userSelect: "none", display: "block" },
  placeholder: { color: "#666" },
};
