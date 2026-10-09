import { rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeEach, expect, test, vi } from "vitest";
import {
  compressCourtImage,
  courtImageExtension,
  deleteCourtImage,
  readCourtImage,
  readCourtThumbnail,
  saveCourtImage,
} from "./court-image-store";

const COURT = "vitest/photos";
const PHOTO = "123e4567-e89b-12d3-a456-426614174000";

beforeEach(() => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("BLOB_STORE_ID", "");
});

afterAll(async () => {
  await rm(path.join(process.cwd(), "data/court-images/vitest"), { recursive: true, force: true });
  vi.unstubAllEnvs();
});

test("accepts jpeg, png, and webp only", () => {
  expect(courtImageExtension("image/jpeg")).toBe("jpg");
  expect(courtImageExtension("image/png")).toBe("png");
  expect(courtImageExtension("image/webp")).toBe("webp");
  expect(courtImageExtension("image/gif")).toBeNull();
});

test("re-encodes a photo as webp and does not enlarge a small one", async () => {
  const small = await sharp({
    create: { width: 8, height: 4, channels: 3, background: { r: 200, g: 10, b: 10 } },
  })
    .png()
    .toBuffer();
  const stored = await compressCourtImage(new Uint8Array(small));
  const meta = await sharp(Buffer.from(stored.bytes)).metadata();
  expect(stored.contentType).toBe("image/webp");
  expect(meta.format).toBe("webp");
  expect(meta.width).toBe(8);
  expect(meta.height).toBe(4);

  const large = await sharp({
    create: { width: 1600, height: 800, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .jpeg()
    .toBuffer();
  const resized = await compressCourtImage(new Uint8Array(large));
  const resizedMeta = await sharp(Buffer.from(resized.bytes)).metadata();
  expect(resizedMeta.width).toBeLessThanOrEqual(1200);
  expect(resizedMeta.height).toBeLessThanOrEqual(1200);

  await expect(compressCourtImage(new Uint8Array([1, 2, 3]))).rejects.toThrow();
});

test("stores a full photo and a thumbnail on disk, and refuses a path that leaves the folder", async () => {
  const bytes = await sharp({
    create: { width: 400, height: 200, channels: 3, background: { r: 20, g: 80, b: 20 } },
  })
    .png()
    .toBuffer();
  const stored = await compressCourtImage(new Uint8Array(bytes));

  await saveCourtImage(COURT, PHOTO, stored.bytes, stored.contentType);
  const full = await readCourtImage(COURT, PHOTO, stored.contentType);
  const thumb = await readCourtThumbnail(COURT, PHOTO);
  expect(new Uint8Array(full!)).toEqual(stored.bytes);
  expect(thumb).not.toBeNull();
  const thumbMeta = await sharp(Buffer.from(thumb!)).metadata();
  expect(thumbMeta.width).toBeLessThanOrEqual(320);
  expect(thumbMeta.format).toBe("webp");

  await deleteCourtImage(COURT, PHOTO, stored.contentType);
  expect(await readCourtImage(COURT, PHOTO, stored.contentType)).toBeNull();
  await expect(deleteCourtImage(COURT, PHOTO, stored.contentType)).resolves.toBeUndefined();

  expect(await readCourtImage(COURT, "not-a-uuid", "image/webp")).toBeNull();
  await expect(saveCourtImage("../secret", PHOTO, stored.bytes, "image/webp")).rejects.toThrow(
    "invalid court image",
  );
  await expect(saveCourtImage(COURT, "not-a-uuid", stored.bytes, "image/webp")).rejects.toThrow(
    "invalid court image",
  );
});
