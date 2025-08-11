# Flipbook GIF Maker

子どもの“パラパラ漫画”みたいに、フォルダ（または複数選択）の画像を**ファイル名の昇順**で再生し、そのまま**GIF に書き出し**できる PWA（React + TypeScript + Vite）。
PC/スマホ両対応。**オフラインでも動作**します。

---

## 機能

* **プレビュー再生**：デフォルト 0.5 秒/枚（UIで変更可）で表示
* **読み込み**：

  * PC：📁 フォルダ選択（`webkitdirectory`）
  * スマホ：🖼 画像を複数選択（自動フォールバック）
* **並び順**：ファイル名**昇順（自然順ソート）**
* **GIF 書き出し**

  * 進捗バー表示＆**キャンセル**対応
  * **Web Share API**（対応端末は共有シートへ／非対応はダウンロードに自動フォールバック）
  * 背景色 / 出力サイズ / 品質 / フレーム間隔を指定可能
* **読み込み軽量化**：最大辺 **1024px（初期値）** に自動縮小してから処理（JPEG/WebP 選択可）
* **PWA**：インストール、オフライン起動、スプラッシュ／アイコン

---

## 画面ざっくり

* 上部：フォルダ/画像選択、再生/停止/リセット、現在フレーム表示
* 設定パネル：**フレーム間隔 / 出力サイズ / 背景色 / 品質 / 読み込みリサイズ**
* 書き出し：**進捗バー**と**キャンセル**
* 下部：**正方形ステージ**にプレビュー

---

## 技術スタック

* **React + TypeScript + Vite**
* GIF エンコード：**gif.js**（Web Worker）
* PWA：**vite-plugin-pwa**
* アイコン生成（任意）：**sharp**（ローカルスクリプト）

---

## フォルダ構成

```
src/
  App.tsx
  types/
    gifjs.d.ts
    index.ts
  utils/
    image.ts            # loadDrawable / downscaleIfNeeded / getSourceSize
    download.ts         # downloadBlob
  hooks/
    usePlayback.ts      # requestAnimationFrame の再生ループ
  features/
    exportGif.ts        # GIF書き出し（進捗 & キャンセル & onProgress）
  components/
    FilePicker.tsx
    ControlPanel.tsx
    FlipbookStage.tsx
    ProgressBar.tsx
helpers/
  share.ts              # Web Share → 共有 or DL フォールバック
public/
  icons/                # PWA アイコン（後述スクリプトで生成）
  apple-touch-icon.png
  favicon-16x16.png
  favicon-32x32.png
```

---

## セットアップ

```bash
# Node.js 18+ 推奨
npm i
npm run dev
```

* 開発サーバ：`http://localhost:5173`（Vite 既定）

---

## 使い方

1. **画像読み込み**

   * PC：📁 フォルダを選択（`webkitdirectory`）
   * モバイル：🖼 画像を複数選択（自動フォールバック）
2. **プレビュー**

   * ▶ 再生 / ⏸ 停止 / ↺ リセット
   * 「フレーム間隔（ms）」で速度調整
3. **GIF 書き出し**

   * 設定（出力サイズ／背景色／品質／間隔）を調整
   * 「GIFを書き出し」→ 進捗バー → 完了時に**共有（対応端末）**または**ダウンロード**

> iOS の一部では `download` 属性が効かないため、自動で **新規タブ→長押し保存** にフォールバックします。

---

## 読み込みリサイズ（高速化）

* 初期値：**最大辺 1024px** に縮小 → デコード＆エンコードが高速・省メモリ
* UI から **オフ / 1024 / 1536 / 2048 px** と **JPEG / WebP** を選択できます
* 大きな写真（例：4000×3000）で効果大

---

## PWA

1. `vite-plugin-pwa` を導入済み（`vite.config.ts` で `VitePWA` を設定）
2. `main.tsx` で `registerSW({ immediate: true })` を呼び出し
3. できること：**インストール**／**オフライン起動**／**高速再訪問**／**スプラッシュ＆アイコン**

---

## ビルド & デプロイ

```bash
npm run build
npm run preview   # dist/ をローカル確認
```

* **Vercel / Netlify**：ビルド `npm run build`、公開ディレクトリ `dist/`
* **GitHub Pages**：サブパス配信時は `vite.config.ts` の `base` と PWA manifest の `start_url` / `scope` を合わせる

---

## アイコン生成（任意）

`sharp` を使ったローカルスクリプトで、1枚の元画像から PWA アイコン／maskable／favicon／Apple Touch を一括生成できます。

```bash
npm i -D sharp
npm run icons
# 例: node scripts/generate-icons.mjs src/assets/logo.png --bg #1f6feb --padding 0.12
```

生成物：

```
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-192.png
public/icons/maskable-512.png
public/apple-touch-icon.png
public/favicon-16x16.png
public/favicon-32x32.png
```

manifest の `icons` とサイズ・パスを一致させてください。

---

## 互換性メモ

* **フォルダ選択**（`webkitdirectory`）：PC の Chrome/Edge/Safari で動作
  → モバイルは自動で**複数画像選択**にフォールバック
* **Web Share API（files）**：iOS/Android/Safari/Chromium 系で概ね動作
  → 非対応は**ダウンロード**へ自動フォールバック
* **HEIC/HEIF**：`createImageBitmap` 失敗時は `<img>` にフォールバック

---

## よくあるトラブル

* **GIF が重い / 開けない**：出力サイズを下げる、フレーム数を減らす、背景色を白にする
* **iOS で保存できない**：共有シート→写真保存、または新規タブで開いて**長押し保存**

---

## 今後の拡張アイデア

* Space / ←→ の**キーボード操作**
* **フレーム範囲**を選んで書き出し
* **EXIF 自動回転**（縦横補正）
* **設定の保存**（localStorage）
* **サンプル画像読み込み**（デモ用アセット）
* **APNG / MP4 出力**

## 最後に

このアプリは ChatGPT に作成してもらいました。ありがとう！🤖
