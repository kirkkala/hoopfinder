import { afterEach, beforeEach, expect, test, vi } from "vitest";

const store = vi.hoisted(() => ({
  createFeedback: vi.fn(),
  takeFeedbackSlot: vi.fn(),
  feedbackClientIp: vi.fn(() => "203.0.113.5"),
}));

vi.mock("@/lib/feedback-store", () => store);

import { POST } from "./route";

const body = {
  title: "Bugi kartalla",
  body: "Zoomaus hyppää.",
  email: "visitor@example.com",
  company: "",
};

function post(payload: unknown) {
  return new Request("https://www.hoopfinder.fi/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  store.takeFeedbackSlot.mockResolvedValue(true);
  store.createFeedback.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("rejects a bad body before spending a rate-limit slot", async () => {
  const invalid = await POST(post("{"));
  expect(invalid.status).toBe(400);

  const incomplete = await POST(post({ title: "Hei" }));
  expect(incomplete.status).toBe(400);
  expect(store.takeFeedbackSlot).not.toHaveBeenCalled();
  expect(store.createFeedback).not.toHaveBeenCalled();
});

test("pretends a honeypot submission succeeded and does not store it", async () => {
  const response = await POST(post({ ...body, company: "Acme Ltd" }));
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({ ok: true });
  expect(store.takeFeedbackSlot).not.toHaveBeenCalled();
  expect(store.createFeedback).not.toHaveBeenCalled();
});

test("maps the hourly limit and a down database onto HTTP statuses", async () => {
  store.takeFeedbackSlot.mockResolvedValueOnce(false);
  const limited = await POST(post(body));
  expect(limited.status).toBe(429);
  expect(limited.headers.get("Retry-After")).toBe("3600");
  expect(store.createFeedback).not.toHaveBeenCalled();

  store.takeFeedbackSlot.mockResolvedValueOnce(null);
  expect((await POST(post(body))).status).toBe(503);

  store.createFeedback.mockResolvedValueOnce({ error: "unavailable" });
  expect((await POST(post(body))).status).toBe(503);

  const created = await POST(post({ ...body, email: " Visitor@Example.com " }));
  expect(created.status).toBe(201);
  expect(store.createFeedback).toHaveBeenLastCalledWith({
    title: "Bugi kartalla",
    body: "Zoomaus hyppää.",
    email: "visitor@example.com",
  });
});

test("stores an empty address as null", async () => {
  const created = await POST(post({ ...body, email: "  " }));
  expect(created.status).toBe(201);
  expect(store.createFeedback).toHaveBeenCalledWith({
    title: "Bugi kartalla",
    body: "Zoomaus hyppää.",
    email: null,
  });
});
