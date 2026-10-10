import { afterEach, beforeEach, expect, test, vi } from "vitest";

const submitted = vi.hoisted(() => ({
  createSubmittedCourt: vi.fn(),
  takeCourtSubmissionSlot: vi.fn(),
  listSubmittedCourts: vi.fn(),
  courtSubmissionIp: vi.fn(() => "203.0.113.5"),
}));

vi.mock("@/lib/submitted-courts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/submitted-courts")>();
  return { ...actual, ...submitted };
});

import { GET, POST } from "./route";

const body = {
  name: "Kallio",
  address: "Helsinginkatu 1",
  email: "visitor@example.com",
  lat: 60.1699,
  lon: 24.9384,
};

function post(payload: unknown) {
  return new Request("https://www.hoopfinder.fi/api/submitted-courts", {
    method: "POST",
    headers: { "content-type": "application/json", host: "www.hoopfinder.fi" },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  submitted.takeCourtSubmissionSlot.mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("returns an empty list when loading submitted courts throws", async () => {
  submitted.listSubmittedCourts.mockRejectedValue(new Error("down"));
  const response = await GET();
  await expect(response.json()).resolves.toEqual({ courts: [] });
});

test("rejects a bad body before spending a rate-limit slot", async () => {
  const invalid = await POST(post("{"));
  expect(invalid.status).toBe(400);

  const incomplete = await POST(post({ name: "Kallio" }));
  expect(incomplete.status).toBe(400);
  expect(submitted.takeCourtSubmissionSlot).not.toHaveBeenCalled();
});

test("maps submission results and the hourly limit onto HTTP statuses", async () => {
  submitted.takeCourtSubmissionSlot.mockResolvedValueOnce(false);
  const limited = await POST(post(body));
  expect(limited.status).toBe(429);
  expect(limited.headers.get("Retry-After")).toBe("3600");

  submitted.takeCourtSubmissionSlot.mockResolvedValueOnce(null);
  expect((await POST(post(body))).status).toBe(503);

  submitted.createSubmittedCourt.mockResolvedValueOnce({ error: "too-close" });
  expect((await POST(post(body))).status).toBe(409);

  submitted.createSubmittedCourt.mockResolvedValueOnce({ error: "outside-finland" });
  expect((await POST(post(body))).status).toBe(400);

  submitted.createSubmittedCourt.mockResolvedValueOnce({ error: "email" });
  expect((await POST(post(body))).status).toBe(503);

  submitted.createSubmittedCourt.mockResolvedValueOnce({ court: { id: "submitted-10014" } });
  const created = await POST(post(body));
  expect(created.status).toBe(201);
  expect(submitted.createSubmittedCourt).toHaveBeenLastCalledWith(
    expect.objectContaining(body),
    "https://www.hoopfinder.fi",
  );
});

test("does not count submissions while the app is running in development", async () => {
  vi.stubEnv("NODE_ENV", "development");
  submitted.createSubmittedCourt.mockResolvedValue({ court: { id: "submitted-10014" } });
  expect((await POST(post(body))).status).toBe(201);
  expect(submitted.takeCourtSubmissionSlot).not.toHaveBeenCalled();
});
