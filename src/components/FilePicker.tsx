import { useMemo } from "react";

interface Props {
  onFiles: (files: File[]) => void | Promise<void>;
}

export default function FilePicker({ onFiles }: Props) {
  // iOS (iPadOS含む) 判定：iPadOSが Mac っぽく名乗るケースも拾う
  const isIOS = useMemo(() => {
    const ua = navigator.userAgent || "";
    const isiOSDevice = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ は UA に "Macintosh" を含むが、タッチポイント > 1
    const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    return isiOSDevice || isIPadOS;
  }, []);

  const isTouch = useMemo(() => window.matchMedia?.("(pointer: coarse)")?.matches ?? false, []);

  // Chromium 系であれば UA-CH からもモバイル判定を補助
  const uaDataMobile = (navigator as any).userAgentData?.mobile ?? false;

  // 最終的にモバイル扱いにするか
  const forceMobile = isIOS || isTouch || uaDataMobile;

  // PCのみでフォルダ選択を許可（モバイルは常に false）
  const supportsDirectory = useMemo(() => {
    if (forceMobile) return false;
    const input = document.createElement("input");
    return "webkitdirectory" in (input as any);
  }, [forceMobile]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    onFiles(files);
    e.currentTarget.value = ""; // 同じ選択の直後再選択を許可
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {forceMobile ? (
        <>
          <label style={labelStyle}>
            🖼 写真から選ぶ
            <input type="file" multiple accept="image/*" onChange={handleChange} style={{ display: "none" }} />
          </label>
          <label style={labelStyle}>
            📷 カメラで撮る
            <input type="file" accept="image/*" capture="environment" onChange={handleChange} style={{ display: "none" }} />
          </label>
          <small style={{ opacity: 0.7 }}>
            ※ iOS で「ブラウズ」が出たら、上部の「写真」に切り替えて選んでください
          </small>
        </>
      ) : supportsDirectory ? (
        <label style={labelStyle}>
          📁 フォルダを選択（PC）
          <input
            type="file"
            // @ts-ignore 非標準
            webkitdirectory=""
            directory=""
            multiple
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </label>
      ) : (
        <label style={labelStyle}>
          🖼 画像を選択（複数可）
          <input type="file" multiple accept="image/*" onChange={handleChange} style={{ display: "none" }} />
        </label>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  background: "#333333",
  color: "white",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  userSelect: "none",
};
