import { COURT_PHOTO_REQUEST_BYTES } from "@/lib/constants";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Longest side sent to the server. The stored photo is resized again to 1200. */
const UPLOAD_EDGE = 1600;

export function fittedSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width: Math.max(1, width), height: Math.max(1, height) };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * A photo the platform will accept. Files already under the request limit are
 * unchanged. Larger ones are redrawn as a smaller JPEG.
 */
export async function fileForCourtUpload(file: File): Promise<File> {
  if (file.size <= COURT_PHOTO_REQUEST_BYTES && ACCEPTED.has(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    let edge = UPLOAD_EDGE;
    let blob = await drawJpeg(canvas, context, bitmap, edge, 0.82);
    if (blob.size > COURT_PHOTO_REQUEST_BYTES) {
      edge = 1200;
      blob = await drawJpeg(canvas, context, bitmap, edge, 0.72);
    }
    if (blob.size > COURT_PHOTO_REQUEST_BYTES) {
      throw new Error("photo still too large");
    }
    const stem = file.name.replace(/\.[^.]+$/, "") || "court";
    return new File([blob], `${stem}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

async function drawJpeg(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const size = fittedSize(bitmap.width, bitmap.height, maxEdge);
  canvas.width = size.width;
  canvas.height = size.height;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) throw new Error("empty image");
  return blob;
}
