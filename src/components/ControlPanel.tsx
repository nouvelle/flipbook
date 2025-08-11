import { useEffect, useState } from "react";
import type { SizePreset } from "../types";

interface Props {
  frameMs: number; setFrameMs: (v: number) => void;
  sizePreset: SizePreset; setSizePreset: (v: SizePreset) => void;
  customSize: number; setCustomSize: (v: number) => void;
  bgColor: string; setBgColor: (v: string) => void;
  quality: number; setQuality: (v: number) => void;
  importMaxEdge: number | "off"; setImportMaxEdge: (v: number | "off") => void;
  importFormat: "image/jpeg" | "image/webp"; setImportFormat: (v: "image/jpeg" | "image/webp") => void;
  onExport: () => void; exportDisabled: boolean;
  supersample: 1 | 2 | 3; setSupersample: (v: 1 | 2 | 3) => void;
}

// コンポーネント先頭あたりに追加
const numericKbdProps = {
  inputMode: "numeric" as const,
  pattern: "[0-9]*",
  enterKeyHint: "done" as const,
  autoComplete: "off" as const,
};


export default function ControlPanel(p: Props) {
  const [customSizeText, setCustomSizeText] = useState(String(p.customSize));
  const [frameMsText, setFrameMsText] = useState(String(p.frameMs));
  const [qualityText, setQualityText] = useState(String(p.quality));

  useEffect(() => setCustomSizeText(String(p.customSize)), [p.customSize]);
  useEffect(() => setFrameMsText(String(p.frameMs)), [p.frameMs]);
  useEffect(() => setQualityText(String(p.quality)), [p.quality]);

  // カスタムサイズ
  const commitCustomSize = () => {
    const n = Number(customSizeText);
    if (!Number.isFinite(n)) {
      // 無効入力は親の値に巻き戻し
      setCustomSizeText(String(p.customSize));
      return;
    }
    const clamped = Math.min(2048, Math.max(64, Math.round(n)));
    p.setCustomSize(clamped);
    setCustomSizeText(String(clamped));
  };

  // フレーム間隔：50〜5000、step=50 にスナップ
  const commitFrameMs = () => {
    const n = Number(frameMsText);
    if (!Number.isFinite(n)) return setFrameMsText(String(p.frameMs));
    const snapped = Math.round(n / 50) * 50; // step=50 に寄せる
    const clamped = Math.min(5000, Math.max(50, snapped));
    p.setFrameMs(clamped);
    setFrameMsText(String(clamped));
  };

  const commitQuality = () => {
    const n = Number(qualityText);
    if (!Number.isFinite(n)) {
      setQualityText(String(p.quality));
      return;
    }
    const rounded = Math.round(n);                // step=1 に合わせて整数化
    const clamped = Math.min(30, Math.max(1, rounded));
    p.setQuality(clamped);
    setQualityText(String(clamped));
  };

  return (
    <div style={panel}>
      <Field label="フレーム間隔（ms）">
        <input type="number" min={50} max={5000} step={50}
          value={frameMsText}
          onChange={(e) => setFrameMsText(e.currentTarget.value)}
          onBlur={commitFrameMs}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          style={input}
          {...numericKbdProps}
        />
      </Field>

      <Field label="書き出しサイズ">
        <select
          value={String(p.sizePreset)}
          onChange={(e) => {
            const v = e.target.value;
            p.setSizePreset(v === "stage" ? "stage" : (Number(v) as SizePreset));
          }}
          style={select}
        >
          <option value="stage">ステージサイズ</option>
          <option value="256">256 × 256</option>
          <option value="512">512 × 512</option>
          <option value="720">720 × 720</option>
        </select>
        <span style={{ marginLeft: 8 }}>カスタム：</span>
        <input type="number" min={64} max={2048} step={32}
          value={customSizeText}                             // ← 文字列 state を表示
          onChange={(e) => setCustomSizeText(e.currentTarget.value)}  // ← 入力中はそのまま保持
          onBlur={commitCustomSize}                          // ← フォーカス外れたら確定
          onKeyDown={(e) => { if (e.key === "Enter") {      // ← Enter でも確定
            e.currentTarget.blur();
          }}}
          style={{ ...input, width: 100 }}
          {...numericKbdProps}
        /><span> px</span>
      </Field>

      <Field label="背景色">
        <input type="color" value={p.bgColor} onChange={(e) => p.setBgColor(e.currentTarget.value)} style={color} />
      </Field>

      <Field label="品質（1=高品質, 30=低）">
        <input type="number" min={1} max={30} step={1}
          value={qualityText}                                   // ← 文字列バッファ
          onChange={(e) => setQualityText(e.currentTarget.value)} // ← 入力中はそのまま
          onBlur={commitQuality}                                   // ← フォーカス外で確定
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} // ← Enter確定
          style={{ ...input, width: 80 }}
          {...numericKbdProps}
        />
      </Field>

      <Field label="読み込みリサイズ（最大辺）">
        <select
          value={String(p.importMaxEdge)}
          onChange={(e) => {
            const v = e.target.value;
            p.setImportMaxEdge(v === "off" ? "off" : Number(v));
          }}
          style={select}
        >
          <option value="off">オフ</option>
          <option value="1024">1024 px</option>
          <option value="1536">1536 px</option>
          <option value="2048">2048 px</option>
        </select>
        <label style={{ marginLeft: 8 }}>形式</label>
        <select value={p.importFormat} onChange={(e) => p.setImportFormat(e.currentTarget.value as any)} style={select}>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select>
      </Field>

      <Field label="高画質サンプリング">
        <select
          value={String(p.supersample)}
          onChange={(e) => p.setSupersample(Number(e.currentTarget.value) as 1 | 2 | 3)}
          style={select}
        >
          <option value="1">標準（1x）</option>
          <option value="2">高（2x）</option>
          <option value="3">最高（3x・重い）</option>
        </select>
      </Field>
      <button onClick={p.onExport} disabled={p.exportDisabled} style={{ ...button, fontWeight: 600 }}>
        🧩 GIFを書き出し
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={field}>
      <label>{label}</label>
      {children}
    </div>
  );
}

const panel: React.CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", alignItems: "center", marginBottom: 12 };
const field: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const input: React.CSSProperties = { padding: "6px 8px", borderRadius: 8, border: "1px solid #d1d5db" };
const select = input;
const color: React.CSSProperties = { width: 40, height: 32, padding: 0, border: "1px solid #d1d5db", borderRadius: 6 };
const button: React.CSSProperties = { background: "#e7eefc", border: "1px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", cursor: "pointer" };
