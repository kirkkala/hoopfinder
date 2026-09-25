import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Court photos are files plus a database row.
 * Local development writes them under data/court-images.
 * Swap this module for Vercel Blob when that store exists; callers stay the same.
 */
const ROOT = path.join(process.cwd(), "data", "court-images");

const EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type CourtImageType = keyof typeof EXTENSION;

export function courtImageExtension(contentType: string): string | null {
  if (contentType in EXTENSION) return EXTENSION[contentType as CourtImageType];
  return null;
}

function imagePath(id: string, contentType: string): string | null {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const extension = courtImageExtension(contentType);
  if (!extension) return null;
  return path.join(ROOT, `${id}.${extension}`);
}

export async function saveCourtImage(
  id: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const file = imagePath(id, contentType);
  if (!file) throw new Error("invalid court image");
  await mkdir(ROOT, { recursive: true });
  await writeFile(file, bytes);
}

export async function readCourtImage(
  id: string,
  contentType: string,
): Promise<Uint8Array | null> {
  const file = imagePath(id, contentType);
  if (!file) return null;
  try {
    return await readFile(file);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}
