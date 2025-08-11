interface Props {
  stageRef: React.RefObject<HTMLDivElement>;
  imageUrl?: string;
  alt?: string;
}

export default function FlipbookStage({ stageRef, imageUrl, alt }: Props) {
  return (
    <div ref={stageRef} style={stage}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt ?? ""} style={img} draggable={false} />
      ) : (
        <div style={{ color: "#666" }}>画像フォルダ/画像を選択してください</div>
      )}
    </div>
  );
}

const stage: React.CSSProperties = {
  width: "min(90vw, 900px)",
  aspectRatio: "1 / 1",
  background: "#f6f8fa",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
};
const img: React.CSSProperties = { width: "100%", height: "100%", objectFit: "contain", backgroundColor: "black", userSelect: "none", display: "block" };
