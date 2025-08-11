// Blob をダウンロード（iOS Safari は新規タブで開いて長押し保存させる）
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  const canDownload = "download" in HTMLAnchorElement.prototype;
  if (canDownload) {
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(url, "_blank"); // iOS Safari フォールバック
  }
  URL.revokeObjectURL(url);
}
