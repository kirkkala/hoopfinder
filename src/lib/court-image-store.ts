import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobNotFoundError, del, get, put } from "@vercel/blob";
import sharp from "sharp";

/**
 * Court photos are files plus a database row.
 * On Vercel they live in the private Blob store. The pathname matches the
 * court page (`court-images/lipas/82547/{id}.webp`), and each save also writes
 * `{id}.thumb.webp` for the gallery. The lightbox keeps the full file.
 * Local development writes the same layout under data/court-images.
 * Camera names are dropped when the file is re-encoded.
 * Reads never throw: a missing file or a store error is a missing photo.
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

/** The store is connected on Vercel. A laptop without that variable keeps the local folder. */
function usesBlob(): boolean {
  return process.env.VERCEL === "1" && Boolean(process.env.BLOB_STORE_ID);
}

function courtSegments(courtPath: string): string[] | null {
  const segments = courtPath.split("/");
  if (
    segments.length < 2 ||
    segments.length > 4 ||
    segments.some((segment) => !/^[\w.-]{1,80}$/.test(segment))
  ) {
    return null;
  }
  return segments;
}

function fileName(id: string, contentType: string): string | null {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const extension = courtImageExtension(contentType);
  if (!extension) return null;
  return `${id}.${extension}`;
}

function thumbName(id: string): string | null {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return `${id}.thumb.webp`;
}

function blobKey(courtPath: string, name: string): string | null {
  const segments = courtSegments(courtPath);
  if (!segments) return null;
  return ["court-images", ...segments, name].join("/");
}

function diskPath(courtPath: string, name: string): string | null {
  const segments = courtSegments(courtPath);
  if (!segments) return null;
  return path.join(ROOT, ...segments, name);
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
  const fullName = fileName(id, contentType);
  const smallName = thumbName(id);
  if (!fullName || !smallName) throw new Error("invalid court image");
  const thumb = await thumbnailBytes(bytes);
  if (usesBlob()) {
    const fullKey = blobKey(courtPath, fullName);
    const thumbKey = blobKey(courtPath, smallName);
    if (!fullKey || !thumbKey) throw new Error("invalid court image");
    await putBlob(fullKey, bytes, contentType);
    try {
      await putBlob(thumbKey, thumb, "image/webp");
    } catch (error) {
      await removeBlob(fullKey);
      throw error;
    }
    return;
  }
  const fullFile = diskPath(courtPath, fullName);
  const thumbFile = diskPath(courtPath, smallName);
  if (!fullFile || !thumbFile) throw new Error("invalid court image");
  await mkdir(/* turbopackIgnore: true */ path.dirname(fullFile), { recursive: true });
  await writeFile(/* turbopackIgnore: true */ fullFile, bytes);
  await writeFile(/* turbopackIgnore: true */ thumbFile, thumb);
}

export async function deleteCourtImage(
  courtPath: string,
  id: string,
  contentType: string,
): Promise<void> {
  const fullName = fileName(id, contentType);
  const smallName = thumbName(id);
  if (usesBlob()) {
    await removeBlob(fullName ? blobKey(courtPath, fullName) : null);
    await removeBlob(smallName ? blobKey(courtPath, smallName) : null);
    return;
  }
  await removeFile(fullName ? diskPath(courtPath, fullName) : null);
  await removeFile(smallName ? diskPath(courtPath, smallName) : null);
}

export async function readCourtImage(
  courtPath: string,
  id: string,
  contentType: string,
): Promise<Uint8Array | null> {
  const name = fileName(id, contentType);
  if (!name) return null;
  if (usesBlob()) return readBlob(blobKey(courtPath, name));
  return readIfPresent(diskPath(courtPath, name));
}

export async function readCourtThumbnail(
  courtPath: string,
  id: string,
): Promise<Uint8Array | null> {
  const name = thumbName(id);
  if (!name) return null;
  if (usesBlob()) return readBlob(blobKey(courtPath, name));
  return readIfPresent(diskPath(courtPath, name));
}

async function putBlob(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  await put(key, Buffer.from(bytes), {
    access: "private",
    addRandomSuffix: false,
    contentType,
  });
}

async function readBlob(key: string | null): Promise<Uint8Array | null> {
  if (!key) return null;
  try {
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  } catch (error: unknown) {
    console.error(error);
    return null;
  }
}

async function removeBlob(key: string | null): Promise<void> {
  if (!key) return;
  try {
    await del(key);
  } catch (error: unknown) {
    if (error instanceof BlobNotFoundError) return;
    console.error(error);
  }
}

/**
 * A missing folder, a missing file, or any other disk error is an absent photo.
 * Court pages keep rendering; the picture route answers 404.
 */
async function readIfPresent(file: string | null): Promise<Uint8Array | null> {
  if (!file) return null;
  try {
    // The path is built from the court id, so Turbopack cannot see that it
    // stays under data/court-images and would otherwise trace the whole repo.
    return await readFile(/* turbopackIgnore: true */ file);
  } catch (error: unknown) {
    if (!isMissing(error)) console.error(error);
    return null;
  }
}

async function removeFile(file: string | null): Promise<void> {
  if (!file) return;
  try {
    await unlink(/* turbopackIgnore: true */ file);
  } catch (error: unknown) {
    if (!isMissing(error)) console.error(error);
  }
}

function isMissing(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "ENOENT",
  );
}
