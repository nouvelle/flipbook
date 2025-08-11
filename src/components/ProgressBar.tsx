export default function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return (
    <div style={wrap}>
      {label && <div style={text}>{label}</div>}
      <div style={bar}>
        <div style={{ ...fill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: "grid", gap: 6, width: "min(90vw, 900px)" };
const text: React.CSSProperties = { fontSize: 14, opacity: 0.8 };
const bar: React.CSSProperties = {
  height: 10, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 9999, overflow: "hidden",
};
const fill: React.CSSProperties = { height: "100%", background: "#4f46e5", transition: "width 120ms linear" };
