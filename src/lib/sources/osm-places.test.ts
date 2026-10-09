import { afterEach, expect, test, vi } from "vitest";
import { emptyAmenities, type Court } from "@/lib/courts";
import { enrichOsmPlaces } from "./osm-places";

afterEach(() => {
  vi.unstubAllGlobals();
});

function court(overrides: Partial<Court> & Pick<Court, "id">): Court {
  return {
    source: "osm",
    name: "Kenttä",
    nameFi: "Kenttä",
    status: "active",
    address: null,
    postalCode: null,
    city: null,
    neighborhood: null,
    lat: 60.17,
    lon: 24.94,
    comment: null,
    website: null,
    constructionYear: null,
    owner: null,
    admin: null,
    amenities: emptyAmenities(),
    ...overrides,
  };
}

test("fills a blank OSM address from Nominatim and does not overwrite a known one", async () => {
  const fetchMock = vi.fn(async () =>
    Response.json([
      {
        osm_type: "way",
        osm_id: 9,
        address: {
          road: "Helsinginkatu",
          house_number: "1",
          postcode: "00530",
          town: "Helsinki",
          suburb: "Helsinki",
        },
      },
      {
        osm_type: "node",
        osm_id: 2,
        address: { city: "Helsinki", suburb: "Kallio", road: "Vaasankatu" },
      },
    ]),
  );
  vi.stubGlobal("fetch", fetchMock);

  const courts = await enrichOsmPlaces([
    court({ id: "way-9" }),
    court({ id: "node-2", city: "Espoo", address: "Vanha katu 2" }),
    court({
      id: "node-3",
      address: "Valmis 1",
      city: "Helsinki",
      neighborhood: "Kallio",
    }),
    court({ id: "not-osm" }),
  ]);

  expect(courts[0]).toMatchObject({
    address: "Helsinginkatu 1",
    postalCode: "00530",
    city: "Helsinki",
    neighborhood: null,
  });
  expect(courts[1]).toMatchObject({
    address: "Vanha katu 2",
    city: "Espoo",
    neighborhood: "Kallio",
  });
  expect(courts[2]).toMatchObject({ address: "Valmis 1", neighborhood: "Kallio" });
  const [lookupUrl] = fetchMock.mock.calls[0] as unknown as [URL];
  expect(String(lookupUrl)).toContain("osm_ids=W9%2CN2");
  expect(fetchMock).toHaveBeenCalledOnce();
});
