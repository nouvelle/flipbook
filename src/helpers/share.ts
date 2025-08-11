export async function tryShareOrDownload(
  blob: Blob,
  fallbackDownload: (b: Blob) => void
) {
  const file = new File([blob], "flipbook.gif", { type: "image/gif" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Flipbook GIF" });
      return true; // 共有で完了
    } catch (e: any) {
      // キャンセル等は無視してDLにフォールバック
      if (e?.name !== "AbortError") console.warn("share failed, fallback to download:", e);
    }
  }

  fallbackDownload(blob);
  return false;
}
