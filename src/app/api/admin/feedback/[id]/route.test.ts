import { beforeEach, expect, test, vi } from "vitest";

const auth = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

const store = vi.hoisted(() => ({
  updateFeedbackNotes: vi.fn(),
}));

vi.mock("@/auth", () => auth);
vi.mock("@/lib/feedback-store", () => store);

import { PATCH } from "./route";

function patch(id: string, payload: unknown) {
  return PATCH(
    new Request("https://www.hoopfinder.fi/api/admin/feedback/1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.requireAdmin.mockResolvedValue(null);
  store.updateFeedbackNotes.mockResolvedValue({ ok: true });
});

test("stops before reading the body when the session is not an admin", async () => {
  auth.requireAdmin.mockResolvedValue(Response.json({ error: "unauthorized" }, { status: 401 }));
  const response = await patch("1", { notes: "Vastasin." });
  expect(response.status).toBe(401);
  expect(store.updateFeedbackNotes).not.toHaveBeenCalled();
});

test("rejects a bad body and maps missing rows", async () => {
  expect((await patch("1", "{")).status).toBe(400);
  expect((await patch("1", { notes: "x".repeat(4001) })).status).toBe(400);
  expect(store.updateFeedbackNotes).not.toHaveBeenCalled();

  store.updateFeedbackNotes.mockResolvedValueOnce({ error: "not-found" });
  expect((await patch("nope", { notes: "ok" })).status).toBe(404);

  store.updateFeedbackNotes.mockResolvedValueOnce({ error: "unavailable" });
  expect((await patch("4", { notes: "ok" })).status).toBe(503);
});

test("saves trimmed notes for an admin", async () => {
  const response = await patch("4", { notes: "  Vastasin sähköpostilla.  " });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ ok: true });
  expect(store.updateFeedbackNotes).toHaveBeenCalledWith("4", "Vastasin sähköpostilla.");
});
