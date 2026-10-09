import { afterEach, expect, test, vi } from "vitest";
import { fetchMapCourts } from "./map-courts";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("shows pending pins with the catalog, and still shows the catalog when pending pins fail", async () => {
  const catalog = [{ id: "82547", source: "lipas" }];
  const pending = [{ id: "submitted-10014", source: "pending" }];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/courts") return Response.json({ courts: catalog });
      if (url === "/api/submitted-courts") return Response.json({ courts: pending });
      return new Response("", { status: 404 });
    }),
  );

  await expect(fetchMapCourts()).resolves.toEqual([...pending, ...catalog]);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/courts") return Response.json({ courts: catalog });
      return new Response("", { status: 503 });
    }),
  );
  await expect(fetchMapCourts()).resolves.toEqual(catalog);
});

test("fails when the catalog cannot be loaded, and rethrows a cancelled request", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 500 })),
  );
  await expect(fetchMapCourts()).rejects.toThrow("court list failed");

  const abort = new DOMException("The operation was aborted.", "AbortError");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Promise.reject(abort)),
  );
  await expect(fetchMapCourts()).rejects.toBe(abort);
});
