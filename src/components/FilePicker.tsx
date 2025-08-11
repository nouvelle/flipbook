import { useMemo } from "react";

interface Props {
  onFiles: (files: File[]) => void | Promise<void>;
}

export default function FilePicker({ onFiles }: Props) {
  const supportsDirectory = useMemo(() => {
    const input = document.createElement("input");
    return "webkitdirectory" in (input as any);
  }, []);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    onFiles(files);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {supportsDirectory ? (
        <label style={labelStyle}>
          📁 フォルダを選択
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
            // @ts-ignore: 非標準だが実ブラウザで動く
            webkitdirectory=""
            directory=""
          />
        </label>
      ) : (
        <>
          <label style={labelStyle}>
            🖼 画像を選択（複数可）
            <input type="file" multiple accept="image/*" onChange={handleChange} style={{ display: "none" }} />
          </label>
          <small style={{ opacity: 0.7 }}>※ この端末ではフォルダ選択はできません。</small>
        </>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  background: "#1f6feb",
  color: "white",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  userSelect: "none",
};
