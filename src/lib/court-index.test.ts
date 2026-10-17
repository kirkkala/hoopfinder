import { expect, test } from "vitest";
import { groupCourtPlaces } from "@/lib/court-groups";
import { cityCourtFacts, courtIndex } from "@/lib/court-index";
import { type Court, type ExplorerCourt, emptyAmenities } from "@/lib/courts";

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
      id: "3",
      nameFi: "Suljettu kenttä",
      city: "Espoo",
      neighborhood: null,
      address: null,
      status: "out-of-service-temporarily",
      lat: 60.16,
      lon: 24.7,
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
  expect(helsinki?.courts.map((entry) => [entry.nameFi.trim(), entry.href])).toEqual([
    ["Mustikkamaan liikuntapuisto / Koripallokenttä", "/koripallokentat/helsinki/l82574"],
    ["Mustikkamaan liikuntapuisto / Minikoripallokenttä", "/koripallokentat/helsinki/l82547"],
  ]);
  expect(helsinki?.courts[0]).toMatchObject({
    name: "Mustikkamaa sports park / Basketball court",
    status: "active",
    address: "Mustikkamaantie 8",
    neighborhood: "Kulosaari",
    city: "Helsinki",
    amenities: { lighting: null, freeUse: null },
  });

  const espoo = index.find((group) => group.city === "Espoo");
  expect(espoo?.courts[0]).toMatchObject({
    nameFi: "Koripallokenttä",
    name: "Basketball court",
    href: "/koripallokentat/espoo/l1",
    status: "active",
    address: "Mustikkamaantie 8",
    neighborhood: "Tapiola",
    city: "Espoo",
  });
  expect(espoo?.courts[1]).toMatchObject({
    nameFi: "Suljettu kenttä",
    status: "out-of-service-temporarily",
    address: null,
    neighborhood: null,
    city: "Espoo",
  });
  expect(index.at(-1)?.anchor).toBe("muu");
  expect(index.at(-1)?.pageHref).toBeNull();
  expect(helsinki?.pageHref).toBe("/koripallokentat/helsinki");
  expect(espoo?.pageHref).toBe("/koripallokentat/espoo");
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
  expect(
    index.map((group) => [group.city, group.courts.length, group.anchor, group.pageHref]),
  ).toEqual([
    ["Helsinki", 3, "helsinki", "/koripallokentat/helsinki"],
    ["Järvenpää", 3, "jarvenpaa", "/koripallokentat/jarvenpaa"],
  ]);
});

function submitted(
  overrides: Partial<ExplorerCourt> & Pick<ExplorerCourt, "id" | "nameFi" | "source">,
): ExplorerCourt {
  return {
    name: overrides.nameFi,
    status: "active",
    address: null,
    city: null,
    neighborhood: null,
    lat: 60.186,
    lon: 24.972,
    amenities: { lighting: true, freeUse: null },
    ...overrides,
  } as ExplorerCourt;
}

test("puts a database court under the city written in its address", () => {
  const grouped = groupCourtPlaces([court({ id: "1", nameFi: "Brahenkenttä", city: "Helsinki" })]);

  const index = courtIndex(grouped.courts, [
    submitted({
      id: "submitted-10000",
      source: "submitted",
      nameFi: "Suvilahti",
      address: "Sörnäisten rantatie 22, 00540 Helsinki",
    }),
    submitted({
      id: "submitted-10001",
      source: "pending",
      nameFi: "Tapiolan kenttä",
      status: "pending",
      address: "Testikatu 1, Espoo",
      emailConfirmed: true,
      createdAt: "2026-01-01",
    }),
    submitted({
      id: "submitted-10002",
      source: "pending",
      nameFi: "Kenttä ilman kaupunkia",
      status: "pending",
      address: "Katu 1",
      emailConfirmed: false,
      createdAt: "2026-01-02",
    }),
  ]);

  const helsinki = index.find((group) => group.city === "Helsinki");
  expect(helsinki?.courts.map((entry) => entry.nameFi)).toEqual(["Brahenkenttä", "Suvilahti"]);
  expect(helsinki?.courts[1]).toMatchObject({
    href: "/koripallokentat/helsinki/s10000",
    address: "Sörnäisten rantatie 22, 00540",
    city: "Helsinki",
    source: "submitted",
    amenities: { lighting: true, freeUse: null },
  });

  const espoo = index.find((group) => group.city === "Espoo");
  expect(espoo?.courts[0]).toMatchObject({
    nameFi: "Tapiolan kenttä",
    href: "/koripallokentat/espoo/s10001",
    address: "Testikatu 1",
    source: "pending",
    emailConfirmed: true,
    status: "pending",
  });

  expect(index.at(-1)?.courts[0]).toMatchObject({
    nameFi: "Kenttä ilman kaupunkia",
    address: "Katu 1",
    city: null,
    emailConfirmed: false,
  });
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

test("opens a city page from the second public court", () => {
  const grouped = groupCourtPlaces([
    court({ id: "1", nameFi: "Ainoa", city: "Akaa" }),
    court({
      id: "2",
      nameFi: "Valo",
      city: "Espoo",
      lat: 60.2,
      lon: 24.6,
      amenities: { ...emptyAmenities(), lighting: true, freeUse: true },
    }),
    court({
      id: "3",
      nameFi: "Varjo",
      city: "Espoo",
      lat: 60.21,
      lon: 24.7,
      status: "out-of-service-temporarily",
    }),
  ]);

  const index = courtIndex(grouped.courts, [
    submitted({
      id: "submitted-9",
      source: "pending",
      nameFi: "Tulossa",
      status: "pending",
      city: "Akaa",
      address: "Katu 1, Akaa",
      emailConfirmed: true,
      createdAt: "2026-01-01",
    }),
  ]);

  const akaa = index.find((group) => group.city === "Akaa");
  expect(akaa?.courts.map((entry) => entry.nameFi)).toEqual(["Ainoa", "Tulossa"]);
  expect(akaa?.pageHref).toBeNull();

  const espoo = index.find((group) => group.city === "Espoo");
  expect(espoo?.pageHref).toBe("/koripallokentat/espoo");
  expect(espoo?.courts.map((entry) => entry.href)).toEqual([
    "/koripallokentat/espoo/l2",
    "/koripallokentat/espoo/l3",
  ]);
  expect(cityCourtFacts(espoo?.courts ?? [])).toEqual({ lit: 1, closed: 1 });
});
