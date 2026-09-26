import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Court photos are files plus a database row.
 * Local development writes them under data/court-images/{court path}/{uuid}.webp.
 * The court path is the same one the page uses (`lipas/82547`, `osm/way/123`),
 * so a new catalog only needs a path of its own. The file name is the photo id:
 * camera names collide and are dropped when the file is re-encoded.
 * Each save also writes `{id}.thumb.webp` for the gallery. The lightbox keeps the full file.
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

function imagePath(courtPath: string, id: string, contentType: string): string | null {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const segments = courtPath.split("/");
  if (
    segments.length < 2 ||
    segments.length > 4 ||
    segments.some((segment) => !/^[\w.-]{1,80}$/.test(segment))
  ) {
    return null;
  }
  const extension = courtImageExtension(contentType);
  if (!extension) return null;
  return path.join(ROOT, ...segments, `${id}.${extension}`);
}

/**
 * Longest side after save. A large phone is about 430 CSS pixels wide;
 * 1200 covers that at 2× and a full-screen view, without a print-sized file.
 */
const MAX_EDGE = 1200;

/** Longest side of the gallery thumbnail. The grid shows about 100 CSS pixels. */
const THUMB_EDGE = 320;

/** Resize for phone screens and a later lightbox, and drop camera metadata. */
export async function compressCourtImage(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; contentType: CourtImageType }> {
  const output = await sharp(bytes)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  return { bytes: new Uint8Array(output), contentType: "image/webp" };
}

/** Smaller copy for the gallery. Same shape as the source; nothing is cropped. */
async function thumbnailBytes(bytes: Uint8Array): Promise<Uint8Array> {
  const output = await sharp(bytes)
    .rotate()
    .resize({
      width: THUMB_EDGE,
      height: THUMB_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  return new Uint8Array(output);
}

export async function saveCourtImage(
  courtPath: string,
  id: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const file = imagePath(courtPath, id, contentType);
  if (!file) throw new Error("invalid court image");
  const thumb = thumbnailPath(courtPath, id);
  if (!thumb) throw new Error("invalid court image");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  await writeFile(thumb, await thumbnailBytes(bytes));
}

export async function deleteCourtImage(
  courtPath: string,
  id: string,
  contentType: string,
): Promise<void> {
  await removeFile(imagePath(courtPath, id, contentType));
  await removeFile(thumbnailPath(courtPath, id));
}

export async function readCourtImage(
  courtPath: string,
  id: string,
  contentType: string,
): Promise<Uint8Array | null> {
  const file = imagePath(courtPath, id, contentType);
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

export async function readCourtThumbnail(
  courtPath: string,
  id: string,
): Promise<Uint8Array | null> {
  const file = thumbnailPath(courtPath, id);
  if (!file) return null;
  try {
    return await readFile(file);
  } catch (error: unknown) {
    if (isMissing(error)) return null;
    throw error;
  }
}

function thumbnailPath(courtPath: string, id: string): string | null {
  const full = imagePath(courtPath, id, "image/webp");
  if (!full) return null;
  return path.join(path.dirname(full), `${id}.thumb.webp`);
}

async function removeFile(file: string | null): Promise<void> {
  if (!file) return;
  try {
    await unlink(file);
  } catch (error: unknown) {
    if (isMissing(error)) return;
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "ENOENT",
  );
}
