import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type Court, emptyAmenities } from "@/lib/courts";

const submitted = vi.hoisted(() => ({
  courtAsPublished: vi.fn(),
  createCourtEdit: vi.fn(),
  takeCourtSubmissionSlot: vi.fn(),
  courtSubmissionIp: vi.fn(() => "203.0.113.5"),
}));
const pages = vi.hoisted(() => ({
  loadCourtById: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  getAuthSession: vi.fn(async () => null),
}));

vi.mock("@/lib/submitted-courts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/submitted-courts")>();
  return { ...actual, ...submitted };
});
vi.mock("@/lib/court-page", () => pages);
vi.mock("@/auth", () => auth);

import { POST } from "./route";

const court: Court = {
  id: "1",
  source: "lipas",
  name: "Kallio",
  nameFi: "Kallio",
  status: "active",
  address: "Testikatu 1",
  postalCode: null,
  city: "Helsinki",
  neighborhood: null,
  lat: 60.17,
  lon: 24.94,
  comment: null,
  website: null,
  constructionYear: null,
  owner: null,
  admin: null,
  amenities: emptyAmenities(),
};

function post(payload: unknown) {
  return new Request("https://www.hoopfinder.fi/api/court-edits", {
    method: "POST",
    headers: { "content-type": "application/json", host: "www.hoopfinder.fi" },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  pages.loadCourtById.mockResolvedValue({ court, place: court, sourceFetchedAt: null });
  submitted.courtAsPublished.mockImplementation(async (value: Court) => value);
  submitted.takeCourtSubmissionSlot.mockResolvedValue(true);
  submitted.createCourtEdit.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("rejects a bad body and an unchanged court before spending a rate-limit slot", async () => {
  expect((await POST(post("{"))).status).toBe(400);

  const unchanged = await POST(
    post({
      courtId: "1",
      email: "visitor@example.com",
      details: { lighting: "no", hoopHeight: "" },
    }),
  );
  expect(unchanged.status).toBe(400);
  await expect(unchanged.json()).resolves.toEqual({ error: "unchanged" });
  expect(submitted.takeCourtSubmissionSlot).not.toHaveBeenCalled();
  expect(submitted.createCourtEdit).not.toHaveBeenCalled();
});

test("stores a correction and maps the hourly limit", async () => {
  const created = await POST(
    post({
      courtId: "1",
      email: " Visitor@Example.com ",
      name: "Wrong name",
      details: { hoopHeight: "lower", lighting: "no" },
    }),
  );
  expect(created.status).toBe(201);
  expect(submitted.createCourtEdit).toHaveBeenCalledWith(
    court,
    "visitor@example.com",
    { hoopHeight: "lower" },
    "https://www.hoopfinder.fi",
  );

  submitted.takeCourtSubmissionSlot.mockResolvedValueOnce(false);
  const limited = await POST(
    post({ courtId: "1", email: "visitor@example.com", details: { hoopHeight: "lower" } }),
  );
  expect(limited.status).toBe(429);

  pages.loadCourtById.mockResolvedValueOnce(null);
  expect(
    (await POST(post({ courtId: "1", email: "visitor@example.com", lighting: "no" }))).status,
  ).toBe(404);
});

test("publishes an admin correction without the hourly limit or a confirmation email", async () => {
  auth.getAuthSession.mockResolvedValueOnce({
    user: { isAdmin: true, email: "Admin@Example.com" },
  });

  const created = await POST(post({ courtId: "1", details: { hoopHeight: "lower" } }));
  expect(created.status).toBe(201);
  await expect(created.json()).resolves.toEqual({ ok: true, published: true });
  expect(submitted.takeCourtSubmissionSlot).not.toHaveBeenCalled();
  expect(submitted.createCourtEdit).toHaveBeenCalledWith(
    court,
    "admin@example.com",
    { hoopHeight: "lower" },
    "https://www.hoopfinder.fi",
    { publish: true },
  );
});

test("does not count corrections while the app is running in development", async () => {
  vi.stubEnv("NODE_ENV", "development");
  expect(
    (
      await POST(
        post({ courtId: "1", email: "visitor@example.com", details: { hoopHeight: "official" } }),
      )
    ).status,
  ).toBe(201);
  expect(submitted.takeCourtSubmissionSlot).not.toHaveBeenCalled();
});
