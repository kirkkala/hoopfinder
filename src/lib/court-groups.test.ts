import { expect, test } from "vitest";
import {
  courtOnPlace,
  courtPageCount,
  courtsWithPhotos,
  groupCourtPlaces,
} from "@/lib/court-groups";
import { type Court, emptyAmenities, mergeCourts } from "@/lib/courts";
import bundled from "../../data/courts.json";

const here = { lat: 60.24, lon: 24.93 };
const nearby = { lat: here.lat + 0.0004, lon: here.lon };
const apart = { lat: here.lat + 0.002, lon: here.lon };

function court(overrides: Partial<Court> & Pick<Court, "id" | "nameFi">): Court {
  return {
    source: "lipas",
    name: overrides.nameFi,
    status: "active",
    address: "Pilkekuja 10",
    postalCode: "00660",
    city: "Helsinki",
    neighborhood: null,
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

test("groups pads that share a venue name within 80 m", () => {
  const pads = [
    court({ id: "20", nameFi: "Namika Areena / Koripallokenttä 2" }),
    court({ id: "10", nameFi: "Namika Areena / Koripallokenttä 1", ...nearby }),
    court({
      id: "30",
      nameFi: "Namika Areena / Yhden korin koripallokenttä 1",
      lat: here.lat + 0.0002,
    }),
  ];
  const far = court({ id: "99", nameFi: "Namika Areena / Heittopaikka", ...apart });
  const grouped = groupCourtPlaces([...pads, far]);

  const place = grouped.placeById.get("20");
  expect(place?.id).toBe("10");
  expect(place?.nameFi).toBe("Namika Areena");
  expect(place?.members?.map((item) => item.id)).toEqual(["10", "20", "30"]);
  expect(grouped.placeById.get("99")?.id).toBe("99");
  expect(grouped.courts.map((item) => item.id).sort()).toEqual(["10", "99"]);
  expect(courtPageCount(grouped.courts)).toBe(4);
  expect(grouped.sourceById.get("20")?.nameFi).toBe("Namika Areena / Koripallokenttä 2");
  expect(courtsWithPhotos(place ?? pads[0]).map((item) => item.id)).toEqual(["10", "20", "30"]);
  expect(courtOnPlace(place ?? pads[0], "20").nameFi).toBe("Namika Areena / Koripallokenttä 2");
  expect(courtOnPlace(place ?? pads[0], "10").id).toBe("10");
  expect(courtOnPlace(place ?? pads[0], "folded").id).toBe("10");
  expect(courtOnPlace(grouped.placeById.get("99") ?? far, "99").id).toBe("99");
});

test("groups a same-address pair the names do not share, and leaves a different administrator apart", () => {
  const school = court({
    id: "2",
    nameFi: "Kanniston koulun koripallokenttä",
    admin: "city-technical-services",
  });
  const street = court({
    id: "1",
    nameFi: "Kanniston koulun katukoripallokenttä",
    admin: "city-technical-services",
    ...nearby,
  });
  const other = court({
    id: "3",
    nameFi: "Leikkipuisto Piika",
    admin: "city-sports",
    address: "Arentikuja 5",
    ...nearby,
  });
  const grouped = groupCourtPlaces([school, street, other]);

  expect(grouped.placeById.get("2")?.id).toBe("1");
  expect(grouped.placeById.get("2")?.members?.map((item) => item.id)).toEqual(["1", "2"]);
  expect(grouped.placeById.get("3")?.id).toBe("3");
});

test("does not group generic numbered names by the word koripallokenttä alone", () => {
  const grouped = groupCourtPlaces([
    court({ id: "1", nameFi: "Koripallokenttä 1", address: null, admin: null }),
    court({ id: "2", nameFi: "Koripallokenttä 2", address: null, admin: null, ...nearby }),
  ]);
  expect(grouped.courts.map((item) => item.id)).toEqual(["1", "2"]);
});

test("Namika Areena in the snapshot is one place, and Vuosaari's throw spot stays out", () => {
  const snapshot = bundled as {
    lipas: { courts: Court[] };
    osm: { courts: Court[] };
  };
  const grouped = groupCourtPlaces(mergeCourts([snapshot.lipas.courts, snapshot.osm.courts]));
  const namika = grouped.placeById.get("613857");
  expect(namika?.id).toBe("610739");
  expect(namika?.nameFi).toBe("Namika Areena (Helsingin NMKY)");
  expect(namika?.members?.map((item) => item.id).sort()).toEqual([
    "610739",
    "613855",
    "613856",
    "613857",
  ]);
  expect(grouped.courts.some((item) => item.id === "613855")).toBe(false);
  expect(grouped.sourceById.get("613855")?.nameFi).toContain("Koripallokenttä 2");

  const throwSpot = grouped.placeById.get("613249");
  expect(throwSpot?.id).toBe("613249");
  expect(throwSpot?.members).toBeUndefined();
  expect(grouped.placeById.get("520321")?.members?.map((item) => item.id)).not.toContain("613249");

  expect(grouped.placeById.get("513532")?.id).not.toBe(grouped.placeById.get("603758")?.id);
  expect(grouped.placeById.get("600723")?.id).toBe(grouped.placeById.get("617490")?.id);
});
