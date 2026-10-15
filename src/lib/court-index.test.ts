import { expect, test } from "vitest";
import { groupCourtPlaces } from "@/lib/court-groups";
import { courtIndex } from "@/lib/court-index";
import { type Court, emptyAmenities } from "@/lib/courts";

const here = { lat: 60.18, lon: 24.99 };

function court(overrides: Partial<Court> & Pick<Court, "id" | "nameFi">): Court {
  return {
    source: "lipas",
    name: overrides.name ?? overrides.nameFi,
    status: "active",
    address: "Mustikkamaantie 8",
    postalCode: "00570",
    city: "Helsinki",
    neighborhood: "Kulosaari",
    lat: here.lat,
    lon: here.lon,
    comment: null,
    website: null,
    constructionYear: null,
    owner: null,
    admin: "city-sports",
    amenities: emptyAmenities(),
    ...overrides,
  };
}

test("lists each pad with the title and URL of its court page", () => {
  const grouped = groupCourtPlaces([
    court({
      id: "82574",
      name: "Mustikkamaa sports park / Basketball court",
      nameFi: "Mustikkamaan liikuntapuisto / Koripallokenttä ",
    }),
    court({
      id: "82547",
      name: "Mustikkamaa sports park / Mini basketball court",
      nameFi: "Mustikkamaan liikuntapuisto / Minikoripallokenttä",
      lat: here.lat + 0.0003,
    }),
    court({
      id: "1",
      name: "Basketball court",
      nameFi: "Koripallokenttä",
      city: "Espoo",
      neighborhood: "Tapiola",
      lat: 60.17,
      lon: 24.8,
    }),
    court({
      id: "2",
      nameFi: "Kenttä ilman kaupunkia",
      city: null,
      lat: 61,
      lon: 25,
    }),
  ]);

  const index = courtIndex(grouped.courts);
  expect(index.map((group) => group.city)).toEqual(["Espoo", "Helsinki", null]);

  const helsinki = index.find((group) => group.city === "Helsinki");
  expect(helsinki?.courts.map((entry) => [entry.nameFi, entry.href])).toEqual([
    ["Mustikkamaan liikuntapuisto / Koripallokenttä", "/courts/lipas/82574"],
    ["Mustikkamaan liikuntapuisto / Minikoripallokenttä", "/courts/lipas/82547"],
  ]);
  expect(helsinki?.courts[0]?.name).toBe("Mustikkamaa sports park / Basketball court");

  const espoo = index.find((group) => group.city === "Espoo");
  expect(espoo?.courts[0]).toMatchObject({
    nameFi: "Koripallokenttä, Tapiola",
    name: "Basketball court, Tapiola",
    href: "/courts/lipas/1",
  });
  expect(index.at(-1)?.anchor).toBe("muu");
});

test("groups a city without caring about letter case", () => {
  const grouped = groupCourtPlaces([
    court({ id: "1", nameFi: "Brahenkenttä", city: "Helsinki" }),
    court({ id: "2", nameFi: "Kallion kenttä", city: "Helsinki", lat: 60.185, lon: 24.95 }),
    court({ id: "3", nameFi: "Pasilan kenttä", city: "HELSINKI", lat: 60.2, lon: 24.93 }),
    court({ id: "4", nameFi: "Järvenpään kenttä", city: "JÄRVENPÄÄ", lat: 60.47, lon: 25.09 }),
    court({ id: "5", nameFi: "Järvenpää 2", city: "Järvenpää", lat: 60.48, lon: 25.1 }),
    court({ id: "6", nameFi: "Järvenpää 3", city: "Järvenpää", lat: 60.49, lon: 25.11 }),
  ]);

  const index = courtIndex(grouped.courts);
  expect(index.map((group) => [group.city, group.courts.length, group.anchor])).toEqual([
    ["Helsinki", 3, "helsinki"],
    ["Järvenpää", 3, "jarvenpaa"],
  ]);
});

test("writes an all-caps city in normal spelling", () => {
  const grouped = groupCourtPlaces([
    court({ id: "1", nameFi: "Halikon kenttä", city: "HALIKKO" }),
    court({ id: "2", nameFi: "Siilinjärven kenttä", city: "SIILINJÄRVI", lat: 63.07, lon: 27.66 }),
    court({ id: "3", nameFi: "Kosken kenttä", city: "Koski Tl", lat: 60.65, lon: 23.14 }),
  ]);

  expect(courtIndex(grouped.courts).map((group) => group.city)).toEqual([
    "Halikko",
    "Koski Tl",
    "Siilinjärvi",
  ]);
});
