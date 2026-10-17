import { expect, test } from "vitest";
import { type Court, type ExplorerCourt, emptyAmenities } from "@/lib/courts";
import { currentPinId, pinsForMiniMap } from "@/lib/mini-map";

function page(overrides: Partial<Court> & Pick<Court, "id">): Court {
  return {
    source: "lipas",
    name: "Kallio",
    nameFi: "Kallio",
    status: "active",
    address: null,
    postalCode: null,
    city: "Helsinki",
    neighborhood: "Kallio",
    lat: 60.18,
    lon: 24.95,
    comment: null,
    website: null,
    constructionYear: null,
    owner: null,
    admin: null,
    amenities: emptyAmenities(),
    ...overrides,
  };
}

function pin(overrides: Partial<ExplorerCourt> & Pick<ExplorerCourt, "id">): ExplorerCourt {
  return {
    source: "lipas",
    name: overrides.id,
    nameFi: overrides.id,
    status: "active",
    address: null,
    city: "Helsinki",
    neighborhood: null,
    lat: 60.18,
    lon: 24.95,
    amenities: { lighting: null, freeUse: null },
    ...overrides,
  } as ExplorerCourt;
}

test("shows only the page court until the catalog arrives", () => {
  expect(pinsForMiniMap(page({ id: "1" }), []).map((item) => item.id)).toEqual(["1"]);
});

test("keeps the catalog pin when the page is one of its pads", () => {
  const loaded = [pin({ id: "1", aliases: ["2"], name: "Brahenkenttä", nameFi: "Brahenkenttä" })];
  const court = page({ id: "2", name: "Brahenkenttä 2", nameFi: "Brahenkenttä 2" });

  expect(pinsForMiniMap(court, loaded)).toBe(loaded);
  expect(currentPinId(court, loaded)).toBe("1");
});

test("adds the page court when the catalog does not know it yet", () => {
  const loaded = [pin({ id: "9", lat: 60.2, lon: 24.9 })];
  const result = pinsForMiniMap(page({ id: "2" }), loaded);

  expect(result.map((item) => item.id)).toEqual(["2", "9"]);
  expect(currentPinId(page({ id: "2" }), result)).toBe("2");
});
