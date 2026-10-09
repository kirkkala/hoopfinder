import { afterEach, expect, test, vi } from "vitest";
import { getOsmCourts } from "./osm";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function overpass(elements: unknown[]) {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string | URL, init?: RequestInit) => {
      if (init?.method === "POST") return Response.json({ elements });
      return new Response("1 slots available now");
    }),
  );
}

async function load(elements: unknown[]) {
  overpass(elements);
  const pending = getOsmCourts();
  await vi.runAllTimersAsync();
  return pending;
}

const place = {
  "addr:street": "Helsinginkatu",
  "addr:housenumber": "1",
  "addr:city": "Helsinki",
  "addr:suburb": "Kallio",
};

test("drops indoor and foreign pitches, and reads names, lights, and access from the tags", async () => {
  const courts = await load([
    {
      type: "node",
      id: 1,
      lat: 60.17,
      lon: 24.94,
      tags: {
        "name:fi": "Brahenkenttä",
        "name:en": "Brahe court",
        lit: "yes",
        access: "public",
        hoops: "2",
        ...place,
      },
    },
    {
      type: "node",
      id: 2,
      lat: 60.18,
      lon: 24.95,
      tags: {
        name: "Basketball court",
        "name:en": "Basketball court",
        lit: "maybe",
        access: "customers",
        hoops: "1",
        ...place,
      },
    },
    {
      type: "way",
      id: 3,
      center: { lat: 60.19, lon: 24.96 },
      tags: { "name:fi": "Tietty kenttä", access: "permissive", ...place },
    },
    {
      type: "node",
      id: 4,
      lat: 60.17,
      lon: 24.94,
      tags: { location: "indoor", name: "Sisäkenttä", ...place },
    },
    { type: "node", id: 5, lat: 59.33, lon: 18.07, tags: { name: "Stockholm" } },
    { type: "node", id: 6, tags: { name: "Nowhere" } },
  ]);

  expect(courts.map((court) => court.id)).toEqual(["node-1", "node-2", "way-3"]);
  expect(courts[0]).toMatchObject({
    name: "Brahe court",
    nameFi: "Brahenkenttä",
    address: "Helsinginkatu 1",
    city: "Helsinki",
    neighborhood: "Kallio",
    amenities: { lighting: true, freeUse: true, fieldType: "2 hoops" },
  });
  expect(courts[1]).toMatchObject({
    name: "Koripallokenttä",
    nameFi: "Koripallokenttä",
    amenities: { lighting: null, freeUse: false, fieldType: "1 hoop" },
  });
  expect(courts[2]).toMatchObject({
    lat: 60.19,
    lon: 24.96,
    amenities: { freeUse: null },
  });
});

test("refuses an empty Overpass result so the previous snapshot can be kept", async () => {
  overpass([]);
  const pending = getOsmCourts();
  const failed = expect(pending).rejects.toThrow("Overpass returned no courts");
  await vi.runAllTimersAsync();
  await failed;
});
