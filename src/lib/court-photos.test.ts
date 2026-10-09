import { beforeEach, expect, test, vi } from "vitest";
import { COURT_PHOTO_MAX_BYTES } from "@/lib/constants";
import type { Court } from "@/lib/courts";

const images = vi.hoisted(() => ({
  saveCourtImage: vi.fn(),
  compressCourtImage: vi.fn(),
}));
const catalog = vi.hoisted(() => ({ getBasketballCourt: vi.fn() }));
const submitted = vi.hoisted(() => ({ getSubmittedCourt: vi.fn() }));
const db = vi.hoisted(() => ({ withDb: vi.fn() }));

vi.mock("@/lib/court-image-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/court-image-store")>();
  return {
    ...actual,
    saveCourtImage: images.saveCourtImage,
    compressCourtImage: images.compressCourtImage,
  };
});
vi.mock("@/lib/catalog", () => catalog);
vi.mock("@/lib/submitted-courts", () => submitted);
vi.mock("@/lib/db", () => db);

import { addCourtPhoto, courtPhotoUrl } from "./court-photos";

const court = { id: "82547", source: "lipas" } as Court;

function file(bytes: number[], type: string, name = "court.jpg"): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  catalog.getBasketballCourt.mockResolvedValue({ court, sourceFetchedAt: null });
  submitted.getSubmittedCourt.mockResolvedValue(null);
  db.withDb.mockResolvedValue([]);
  images.compressCourtImage.mockResolvedValue({
    bytes: new Uint8Array([1]),
    contentType: "image/webp",
  });
  images.saveCourtImage.mockResolvedValue(undefined);
});

test("builds the photo url on the court page", () => {
  expect(courtPhotoUrl(court, "photo-1")).toBe("/courts/lipas/82547/photos/photo-1");
});

test("rejects a missing court, a bad email, a long caption, the wrong type, and a full gallery", async () => {
  catalog.getBasketballCourt.mockResolvedValue(null);
  await expect(addCourtPhoto("missing", file([1], "image/jpeg"), "a@b.fi", "")).resolves.toEqual({
    error: "invalid",
  });

  catalog.getBasketballCourt.mockResolvedValue({ court, sourceFetchedAt: null });
  await expect(
    addCourtPhoto(court.id, file([1], "image/jpeg"), "not-an-email", ""),
  ).resolves.toEqual({
    error: "email",
  });
  await expect(
    addCourtPhoto(court.id, file([1], "image/jpeg"), "a@b.fi", "x".repeat(201)),
  ).resolves.toEqual({ error: "invalid" });
  await expect(addCourtPhoto(court.id, file([1], "image/gif"), "a@b.fi", "")).resolves.toEqual({
    error: "type",
  });

  const tooBig = file([1], "image/jpeg");
  Object.defineProperty(tooBig, "size", { value: COURT_PHOTO_MAX_BYTES + 1 });
  await expect(addCourtPhoto(court.id, tooBig, "a@b.fi", "")).resolves.toEqual({
    error: "too-large",
  });

  db.withDb.mockResolvedValue(
    Array.from({ length: 12 }, (_, index) => ({ id: String(index), description: null })),
  );
  await expect(
    addCourtPhoto(court.id, file([0xff, 0xd8, 0xff], "image/jpeg"), "a@b.fi", ""),
  ).resolves.toEqual({
    error: "full",
  });
  expect(images.compressCourtImage).not.toHaveBeenCalled();
});

test("rejects bytes that do not match the declared image type", async () => {
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0];
  await expect(
    addCourtPhoto(court.id, file(pngHeader, "image/jpeg"), "a@b.fi", ""),
  ).resolves.toEqual({ error: "type" });
  expect(images.compressCourtImage).not.toHaveBeenCalled();
});

test("stores a lowercase email and a blank caption as no caption", async () => {
  const inserts: unknown[][] = [];
  db.withDb.mockImplementation(
    async (fn: (sql: (...args: unknown[]) => Promise<unknown[]>) => Promise<unknown>) => {
      const sql = async (...args: unknown[]) => {
        const values = args.slice(1);
        if (values.length > 2) inserts.push(values);
        return [];
      };
      return fn(sql);
    },
  );

  const result = await addCourtPhoto(
    court.id,
    file([0xff, 0xd8, 0xff, 0x00], "image/jpeg"),
    " Person@Example.com ",
    "   ",
  );

  expect(result).toMatchObject({
    photo: {
      url: expect.stringMatching(/^\/courts\/lipas\/82547\/photos\/[0-9a-f-]{36}$/i),
      thumbUrl: expect.stringContaining("?thumb=1"),
      description: null,
    },
  });
  expect(inserts[0]).toContain("person@example.com");
  expect(images.saveCourtImage).toHaveBeenCalledOnce();
});
