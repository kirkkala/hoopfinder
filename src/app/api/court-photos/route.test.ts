/** @vitest-environment node */

import { beforeEach, expect, test, vi } from "vitest";

const photos = vi.hoisted(() => ({
  addCourtPhoto: vi.fn(),
  takeCourtPhotoSlot: vi.fn(),
}));

vi.mock("@/lib/court-photos", () => photos);
vi.mock("@/lib/submitted-courts", () => ({
  courtSubmissionIp: () => "203.0.113.5",
}));

import { POST } from "./route";

function upload(fields: Record<string, string | Blob>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new Request("https://www.hoopfinder.fi/api/court-photos", { method: "POST", body: form });
}

const file = new File([new Uint8Array([1])], "court.jpg", { type: "image/jpeg" });

beforeEach(() => {
  vi.clearAllMocks();
  photos.takeCourtPhotoSlot.mockResolvedValue(true);
  photos.addCourtPhoto.mockResolvedValue({ photo: { id: "photo-1" } });
});

test("rejects a form that is missing a court, an email, or a file", async () => {
  expect((await POST(upload({}))).status).toBe(400);
  expect(
    (await POST(upload({ courtId: "x".repeat(81), email: "a@b.fi", description: "", file })))
      .status,
  ).toBe(400);
  expect(
    (await POST(upload({ courtId: "82547", email: "a@b.fi", description: "", file: "nope" })))
      .status,
  ).toBe(400);
  expect(photos.takeCourtPhotoSlot).not.toHaveBeenCalled();
});

test("maps a full gallery, a down database, and the hourly limit", async () => {
  photos.takeCourtPhotoSlot.mockResolvedValueOnce(false);
  const limited = await POST(upload({ courtId: "82547", email: "a@b.fi", description: "", file }));
  expect(limited.status).toBe(429);
  expect(limited.headers.get("Retry-After")).toBe("3600");

  photos.addCourtPhoto.mockResolvedValueOnce({ error: "full" });
  expect(
    (await POST(upload({ courtId: "82547", email: "a@b.fi", description: "", file }))).status,
  ).toBe(409);

  photos.addCourtPhoto.mockResolvedValueOnce({ error: "unavailable" });
  expect(
    (await POST(upload({ courtId: "82547", email: "a@b.fi", description: "", file }))).status,
  ).toBe(503);

  photos.addCourtPhoto.mockResolvedValueOnce({ error: "type" });
  expect(
    (await POST(upload({ courtId: "82547", email: "a@b.fi", description: "", file }))).status,
  ).toBe(400);
});
