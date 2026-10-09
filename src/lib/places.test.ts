import { afterEach, expect, test, vi } from "vitest";
import { lookupPlace, reverseAddress } from "./places";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("asks Nominatim for a Finnish place and prefers a neighborhood over a station", async () => {
  const fetchMock = vi.fn(async () =>
    Response.json([
      {
        class: "railway",
        type: "station",
        lat: "60.17",
        lon: "24.94",
        boundingbox: ["60.17", "60.17", "24.94", "24.94"],
      },
      {
        class: "place",
        type: "suburb",
        lat: "60.18",
        lon: "24.95",
        boundingbox: ["60.10", "60.40", "24.80", "25.10"],
      },
    ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  const place = await lookupPlace("  Kallio ");
  expect(place).not.toBeNull();
  expect(place!.bounds.south).toBeCloseTo(60.1);
  expect(place!.camera.north - place!.camera.south).toBeLessThan(place!.bounds.north - place!.bounds.south);

  const [calledUrl, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
  const url = String(calledUrl);
  expect(url).toContain("Kallio%2C+Finland");
  expect(url).toContain("countrycodes=fi");
  expect(init).toMatchObject({
    headers: { "User-Agent": expect.stringContaining("HoopFinder") },
  });
});

test("ignores a short query, a failed lookup, and a hit without a box", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await expect(lookupPlace(" k ")).resolves.toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();

  fetchMock.mockResolvedValueOnce(new Response("", { status: 503 }));
  await expect(lookupPlace("Kallio")).resolves.toBeNull();

  fetchMock.mockResolvedValueOnce(Response.json([{ class: "place", type: "city", boundingbox: ["nope"] }]));
  await expect(lookupPlace("Kallio")).resolves.toBeNull();
});

test("expands a point result so the map does not open on a single coordinate", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json([
        {
          class: "place",
          type: "suburb",
          lat: "60.17",
          lon: "24.94",
          boundingbox: ["60.17", "60.17", "24.94", "24.94"],
        },
      ]),
    ),
  );

  const place = await lookupPlace("Kallio");
  expect(place!.bounds.north - place!.bounds.south).toBeGreaterThan(0.01);
});

test("formats a dropped-pin address and falls back through town and village", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  fetchMock.mockResolvedValueOnce(
    Response.json({
      address: { road: "Helsinginkatu", house_number: "1", postcode: "00530", city: "Helsinki" },
    }),
  );
  await expect(reverseAddress(60.17, 24.94)).resolves.toBe("Helsinginkatu 1, 00530 Helsinki");

  fetchMock.mockResolvedValueOnce(Response.json({ address: { town: "Porvoo" } }));
  await expect(reverseAddress(60.39, 25.66)).resolves.toBe("Porvoo");

  fetchMock.mockResolvedValueOnce(Response.json({ address: { village: "Fiskars" } }));
  await expect(reverseAddress(60.13, 23.55)).resolves.toBe("Fiskars");

  fetchMock.mockResolvedValueOnce(Response.json({}));
  await expect(reverseAddress(60.17, 24.94)).resolves.toBeNull();

  fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
  await expect(reverseAddress(60.17, 24.94)).resolves.toBeNull();
});
