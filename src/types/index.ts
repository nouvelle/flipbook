export type ImageBinary = File | Blob;

export interface ImageItem {
  name: string;
  url: string;
  file: ImageBinary;
}

export type SizePreset = "stage" | 256 | 512 | 720;

export interface ExportOptions {
  side: number;
  frameMs: number;
  bgColor: string;
  quality: number; // 1(最高)〜30(低)
}
