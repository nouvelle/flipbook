import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ImageItem, SizePreset } from "./types";
import { downloadBlob } from "./utils/download";
import { downscaleIfNeeded } from "./utils/image";
import { usePlayback } from "./hooks/usePlayback";
import { buildGif } from "./features/exportGif";
import FilePicker from "./components/FilePicker";
import ControlPanel from "./components/ControlPanel";
import FlipbookStage from "./components/FlipbookStage";
import ProgressBar from "./components/ProgressBar";

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [frameMs, setFrameMs] = useState<number>(500);
  const [sizePreset, setSizePreset] = useState<SizePreset>("stage");
  const [customSize, setCustomSize] = useState<number>(640);
  const [bgColor, setBgColor] = useState<string>("#000000");
  const [quality, setQuality] = useState<number>(10);
  const [importMaxEdge, setImportMaxEdge] = useState<number | "off">("off");
  const [importFormat, setImportFormat] = useState<"image/jpeg" | "image/webp">("image/jpeg");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const stageRef = useRef<HTMLDivElement | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const { index, setIndex, playing, start, stop, reset } = usePlayback(images.length, frameMs);

  const hasImages = images.length > 0;
  const current = useMemo(() => (hasImages ? images[index] : undefined), [images, index, hasImages]);

  // ファイル選択（PC=フォルダ or モバイル=複数画像）
  const onFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const processed: ImageItem[] = [];
    for (const f of imageFiles) {
      const bin = importMaxEdge === "off" ? f : await downscaleIfNeeded(f, importMaxEdge, importFormat, 0.85);
      processed.push({ name: f.name, url: URL.createObjectURL(bin), file: bin });
      await new Promise((r) => setTimeout(r, 0)); // 大量時のUI固まり軽減
    }
    const imgs = processed.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    setImages((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.url)); return imgs; });
    setIndex(0);
  }, [importMaxEdge, importFormat, setIndex]);

  // 後片付け
  useEffect(() => () => { images.forEach((p) => URL.revokeObjectURL(p.url)); }, [images]);

  // キャンセル操作
  const cancelExport = useCallback(() => {
    exportAbortRef.current?.abort();
  }, []);

  const exportGif = useCallback(async () => {
    if (!hasImages || !stageRef.current || exporting) return;
    // 再生中なら止めてリソース節約（任意）
    if (playing) stop();

    setExporting(true);
    setExportProgress(0);
    const ctrl = new AbortController();
    exportAbortRef.current = ctrl;

    try {
      const stageSide = Math.round(stageRef.current.clientWidth);
      const side =
        sizePreset === "stage" ? stageSide :
        typeof sizePreset === "number" ? sizePreset :
        customSize;

      const blob = await buildGif(
        images,
        { side, frameMs, bgColor, quality },
        (p) => setExportProgress(p),   // 0..1
        ctrl.signal
      );

      downloadBlob(blob, "flipbook.gif");
    } catch (e: any) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // キャンセル時：トーストなど任意
        console.info("Export aborted.");
      } else {
        console.error(e);
        alert("GIF の書き出し中にエラーが発生しました。");
      }
    } finally {
      setExporting(false);
      setExportProgress(0);
      exportAbortRef.current = null;
    }
  }, [hasImages, stageRef, sizePreset, customSize, images, frameMs, bgColor, quality, exporting, playing, stop]);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", padding: 16 }}>
      <h1 style={{ marginBottom: 12, fontSize: 22 }}>Flipbook Viewer</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <FilePicker onFiles={onFiles} />

        <button onClick={start} disabled={!hasImages || playing} style={btn}>▶ 再生</button>
        <button onClick={stop} disabled={!playing} style={btn}>⏸ 停止</button>
        <button onClick={reset} disabled={!hasImages} style={btn}>↺ リセット</button>

        <span style={{ marginLeft: 8, opacity: 0.8 }}>
          {hasImages ? `${index + 1} / ${images.length} (${current?.name ?? ""})` : "画像未選択"}
        </span>
      </div>

      <ControlPanel
        frameMs={frameMs} setFrameMs={setFrameMs}
        sizePreset={sizePreset} setSizePreset={setSizePreset}
        customSize={customSize} setCustomSize={setCustomSize}
        bgColor={bgColor} setBgColor={setBgColor}
        quality={quality} setQuality={setQuality}
        importMaxEdge={importMaxEdge} setImportMaxEdge={setImportMaxEdge}
        importFormat={importFormat} setImportFormat={setImportFormat}
        onExport={exportGif} exportDisabled={!hasImages}
      />

      {/* ★進捗バー（書き出し中のみ表示） */}
      {exporting && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <ProgressBar progress={exportProgress} label={`GIF 書き出し中… ${Math.round(exportProgress * 100)}%`} />
          <button onClick={cancelExport} style={btn}>キャンセル</button>
        </div>
      )}

      <FlipbookStage ref={stageRef} imageUrl={current?.url} alt={current?.name} />
    </div>
  );
}

const btn: React.CSSProperties = { background: "#e7eefc", border: "1px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", cursor: "pointer" };
