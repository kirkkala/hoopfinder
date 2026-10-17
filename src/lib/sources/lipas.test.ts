import { afterEach, expect, test, vi } from "vitest";
import { getLipasCourts } from "./lipas";

afterEach(() => {
  vi.unstubAllGlobals();
});

function point(
  address: string,
  city: Record<string, unknown>,
  coordinates: [number, number],
  extra: Record<string, unknown> = {},
) {
  return {
    address,
    city,
    geometries: { features: [{ geometry: { coordinates } }] },
    ...extra,
  };
}

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

test("fills a missing postal office from the municipality, and keeps a distinct district", async () => {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      urls.push(String(url));
      const href = String(url);
      if (href.endsWith("/sports-sites/603522")) {
        return Response.json({
          "search-meta": { location: { city: { name: { fi: " Savitaipale " } } } },
        });
      }
      if (href.endsWith("/sports-sites/601592")) {
        return Response.json({
          "search-meta": { location: { city: { name: { fi: "Liminka" } } } },
        });
      }
      return Response.json({
        items: [
          site({
            "lipas-id": 603522,
            location: point("Koulutie 7", { "city-code": 739 }, [27.69, 61.19]),
          }),
          site({
            "lipas-id": 621111,
            location: point("Alaseinäjoenkatu 9", { "city-code": 739 }, [22.84, 62.79]),
          }),
          site({
            "lipas-id": 510794,
            "search-meta": { location: { city: { name: { fi: "Sipoo" } } } },
            location: point(
              "Iso kylätie 8",
              { "city-code": 753, neighborhood: " Sipoo " },
              [25.26, 60.37],
            ),
          }),
          site({
            "lipas-id": 601592,
            location: point(
              "Karintie 3B",
              { "city-code": 425, neighborhood: "Keskusta" },
              [25.41, 64.81],
            ),
          }),
          site({
            location: point("Helsinginkatu 1", { neighborhood: "Kallio" }, [24.94, 60.17], {
              "postal-office": "Helsinki",
            }),
          }),
          site({
            "lipas-id": 88,
            location: point("Karjalantie 59", { neighborhood: "Myllyoja" }, [25.98, 61.16], {
              "postal-office": "MYLLYOJA",
            }),
          }),
        ],
        pagination: { "total-pages": 1 },
      });
    }),
  );

  const courts = await getLipasCourts();
  expect(urls.filter((url) => !url.includes("page=")).sort()).toEqual([
    "https://api.lipas.fi/v2/sports-sites/601592",
    "https://api.lipas.fi/v2/sports-sites/603522",
  ]);
  expect(courts).toEqual([
    expect.objectContaining({ id: "603522", city: "Savitaipale", neighborhood: null }),
    expect.objectContaining({ id: "621111", city: "Savitaipale", neighborhood: null }),
    expect.objectContaining({ id: "510794", city: "Sipoo", neighborhood: null }),
    expect.objectContaining({ id: "601592", city: "Liminka", neighborhood: "Keskusta" }),
    expect.objectContaining({ id: "82547", city: "Helsinki", neighborhood: "Kallio" }),
    expect.objectContaining({ id: "88", city: "Myllyoja", neighborhood: null }),
  ]);
});

test("uses the district when Lipas has no municipality name", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL) => {
      if (String(url).endsWith("/sports-sites/12")) return new Response("", { status: 404 });
      return Response.json({
        items: [
          site({
            "lipas-id": 12,
            location: point("Koulutie", { "city-code": 1, neighborhood: "Halikko" }, [23.07, 60.4]),
          }),
        ],
        pagination: { "total-pages": 1 },
      });
    }),
  );

  const courts = await getLipasCourts();
  expect(courts[0]).toMatchObject({ city: "Halikko", neighborhood: null });
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
