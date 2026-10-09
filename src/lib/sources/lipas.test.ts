import { afterEach, expect, test, vi } from "vitest";
import { getLipasCourts } from "./lipas";

afterEach(() => {
  vi.unstubAllGlobals();
});

function site(overrides: Record<string, unknown> = {}) {
  return {
    "lipas-id": 82547,
    name: "Brahenkenttä",
    location: {
      address: " Helsinginkatu 1 ",
      "postal-office": "Helsinki",
      geometries: {
        features: [{ geometry: { coordinates: [24.94, 60.17] } }],
      },
    },
    ...overrides,
  };
}

test("asks LIPAS for outdoor basketball sites and maps a page of them", async () => {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      urls.push(String(url));
      const page = new URL(String(url)).searchParams.get("page");
      const items =
        page === "1"
          ? [
              site({
                "name-localized": { en: "Brahe court" },
                www: "  ",
                properties: {
                  "ligthing?": true,
                  "free-use?": "yes",
                  "surface-material": ["asphalt", 1],
                  "field-length-m": 28,
                },
              }),
              site({ "lipas-id": 2, location: {} }),
              { "lipas-id": "nope" },
            ]
          : [site({ "lipas-id": 3, name: "Toinen" })];
      return Response.json({ items, pagination: { "total-pages": 2 } });
    }),
  );

  const courts = await getLipasCourts();
  expect(urls).toHaveLength(2);
  expect(urls[0]).toContain("type-codes=1310");
  expect(urls[0]).toContain("statuses=active%2Cout-of-service-temporarily");
  expect(urls.map((url) => new URL(url).searchParams.get("page"))).toEqual(["1", "2"]);

  expect(courts.map((court) => court.id)).toEqual(["82547", "3"]);
  expect(courts[0]).toMatchObject({
    name: "Brahe court",
    nameFi: "Brahenkenttä",
    lat: 60.17,
    lon: 24.94,
    address: "Helsinginkatu 1",
    website: null,
    amenities: {
      lighting: true,
      freeUse: null,
      surfaceMaterial: ["asphalt"],
      lengthM: 28,
    },
  });
});

test("fails the refresh when LIPAS does not return a court list", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 503 })),
  );
  await expect(getLipasCourts()).rejects.toThrow("LIPAS list request failed with 503");

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ items: [] })),
  );
  await expect(getLipasCourts()).rejects.toThrow("LIPAS list payload failed validation");
});
