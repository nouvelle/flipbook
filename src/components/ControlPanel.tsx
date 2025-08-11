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
}

export default function ControlPanel(p: Props) {
  return (
    <div style={panel}>
      <Field label="フレーム間隔（ms）">
        <input
          type="number" min={50} max={5000} step={50} value={p.frameMs}
          onChange={(e) => p.setFrameMs(limitNum(e.currentTarget.value, 50, 5000, 500))}
          style={input}
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
        <input
          type="number" min={64} max={2048} step={32} value={p.customSize}
          onChange={(e) => p.setCustomSize(limitNum(e.currentTarget.value, 64, 2048, 640))}
          style={{ ...input, width: 100 }}
        /><span> px</span>
      </Field>

      <Field label="背景色">
        <input type="color" value={p.bgColor} onChange={(e) => p.setBgColor(e.currentTarget.value)} style={color} />
      </Field>

      <Field label="品質（1=高品質, 30=低）">
        <input
          type="number" min={1} max={30} step={1} value={p.quality}
          onChange={(e) => p.setQuality(limitNum(e.currentTarget.value, 1, 30, 10))}
          style={{ ...input, width: 80 }}
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

function limitNum(v: string, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
  return fallback;
}

const panel: React.CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", alignItems: "center", marginBottom: 12 };
const field: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const input: React.CSSProperties = { padding: "6px 8px", borderRadius: 8, border: "1px solid #d1d5db" };
const select = input;
const color: React.CSSProperties = { width: 40, height: 32, padding: 0, border: "1px solid #d1d5db", borderRadius: 6 };
const button: React.CSSProperties = { background: "#e7eefc", border: "1px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", cursor: "pointer" };
