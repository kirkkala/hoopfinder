import { expect, test } from "vitest";
import { getCopy } from "@/lib/copy";
import {
  COURT_MATCH_KM,
  type Court,
  courtHref,
  courtIdFromParam,
  courtName,
  courtOgHref,
  courtParam,
  courtPath,
  courtPlacementBlocked,
  courtTitle,
  type ExplorerCourt,
  emptyAmenities,
  formatAddress,
  formatReportedBoolean,
  formatStatus,
  formatSurface,
  homeCourtHref,
  isAwaitingEmail,
  isTooCloseToCourt,
  mergeCourts,
  parseCourtPath,
  submittedCourtKey,
  withDistance,
} from "@/lib/courts";
import { haversineKm } from "@/lib/geo";

const here = { lat: 60.17, lon: 24.94 };
const withinPad = { lat: here.lat + 0.0004, lon: here.lon };
const clearOfPad = { lat: here.lat + 0.02, lon: here.lon };

function court(overrides: Partial<Court> & Pick<Court, "id" | "source">): Court {
  return {
    name: overrides.id,
    nameFi: overrides.id,
    status: "active",
    address: null,
    postalCode: null,
    city: null,
    neighborhood: null,
    lat: here.lat,
    lon: here.lon,
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
    city: null,
    neighborhood: null,
    lat: here.lat,
    lon: here.lon,
    amenities: { lighting: null, freeUse: null },
    ...overrides,
  } as ExplorerCourt;
}

test("keeps adjacent pads from the same registry and drops a later source within 80 m", () => {
  expect(haversineKm(here, withinPad)).toBeLessThan(COURT_MATCH_KM);
  expect(haversineKm(here, clearOfPad)).toBeGreaterThan(COURT_MATCH_KM);

  const lipas = court({ id: "1", source: "lipas" });
  const lipasNeighbor = court({ id: "2", source: "lipas", ...withinPad });
  const osmOnTop = court({ id: "way-9", source: "osm", ...withinPad });
  const osmApart = court({ id: "way-10", source: "osm", ...clearOfPad });

  expect(
    mergeCourts([
      [lipas, lipasNeighbor],
      [osmOnTop, osmApart],
    ]).map((item) => item.id),
  ).toEqual(["1", "2", "way-10"]);
  expect(mergeCourts([[osmOnTop], [lipasNeighbor]]).map((item) => item.id)).toEqual(["way-9"]);
});

test("blocks a new pin at 80 m from a catalog court, and only the same spot for an unconfirmed one", () => {
  expect(isTooCloseToCourt(withinPad, [here])).toBe(true);
  expect(isTooCloseToCourt(clearOfPad, [here])).toBe(false);

  expect(courtPlacementBlocked(withinPad, [{ ...here, source: "lipas" }])).toBe(true);
  expect(
    courtPlacementBlocked(withinPad, [{ ...here, source: "pending", emailConfirmed: false }]),
  ).toBe(false);
  expect(
    courtPlacementBlocked({ lat: here.lat + 0.00005, lon: here.lon }, [
      { ...here, status: "unconfirmed" },
    ]),
  ).toBe(true);
  expect(
    courtPlacementBlocked(withinPad, [{ ...here, source: "pending", emailConfirmed: true }]),
  ).toBe(true);
});

test("uses the locale name and adds a place only for a generic court name", () => {
  const generic = {
    name: "Basketball court",
    nameFi: "Koripallokenttä",
    neighborhood: "Kallio",
    city: "Helsinki",
  };
  const finnish = getCopy("fi");
  const english = getCopy("en");

  expect(courtTitle(generic, finnish)).toBe("Koripallokenttä, Kallio");
  expect(courtTitle(generic, english)).toBe("Basketball court, Kallio");
  expect(courtTitle({ ...generic, neighborhood: null, city: null }, finnish)).toBe(
    "Koripallokenttä",
  );
  expect(courtName({ name: "", nameFi: "Brahenkenttä" }, english)).toBe("Brahenkenttä");
  expect(courtTitle({ ...generic, name: "Brahe", nameFi: "Brahenkenttä" }, english)).toBe("Brahe");
});

test("round-trips court ids through the page path and the map query", () => {
  const lipas = { id: "82547", source: "lipas" as const };
  const osm = { id: "way-1095396325", source: "osm" as const };
  const pending = { id: "submitted-10014", source: "pending" as const };

  expect(courtPath(lipas)).toBe("lipas/82547");
  expect(courtParam(lipas)).toBe("lipas-82547");
  expect(courtIdFromParam(courtParam(lipas))).toBe("82547");
  expect(courtHref(lipas)).toBe("/courts/lipas/82547");

  expect(courtPath(osm)).toBe("osm/way/1095396325");
  expect(courtIdFromParam(courtParam(osm))).toBe("way-1095396325");

  expect(courtPath(pending)).toBe("submitted/10014");
  expect(submittedCourtKey(pending.id)).toBe("10014");
  expect(courtIdFromParam(courtParam(pending))).toBe("submitted-10014");
  expect(homeCourtHref(pending, { thanks: true })).toBe("/?court=submitted-10014&thanks=1");
});

test("reads court paths as a court, the home map, or a missing page", () => {
  expect(parseCourtPath([])).toBe("index");
  expect(parseCourtPath(["lipas"])).toBe("index");
  expect(parseCourtPath(["osm", "way"])).toBe("index");
  expect(parseCourtPath(["submitted"])).toBe("index");
  expect(parseCourtPath(["node"])).toBe("index");

  expect(parseCourtPath(["lipas", "82547"])).toEqual({ id: "82547" });
  expect(parseCourtPath(["osm", "way", "1095396325"])).toEqual({ id: "way-1095396325" });
  expect(parseCourtPath(["submitted", "10014"])).toEqual({ id: "submitted-10014" });

  expect(parseCourtPath(["lipas", "82547", "extra"])).toBeNull();
  expect(parseCourtPath(["lipas", "abc"])).toBeNull();
  expect(parseCourtPath(["osm", "pitch", "1"])).toBeNull();
  expect(parseCourtPath(["submitted", "10014", "extra"])).toBeNull();
  expect(parseCourtPath(["somewhere"])).toBeNull();
  expect(courtIdFromParam("lipas")).toBeNull();
});

test("versions an og image only when the fetch time parses", () => {
  const court = { id: "82547", source: "lipas" as const };
  expect(courtOgHref(court, "not-a-date")).toBe("/images/og/lipas-82547");
  expect(courtOgHref(court, "2026-01-15T12:00:00.000Z")).toBe(
    `/images/og/lipas-82547?v=${Date.parse("2026-01-15T12:00:00.000Z")}`,
  );
});

test("sorts by distance, and without a location by city then Finnish name", () => {
  const espoo = pin({ id: "b", city: "Espoo", nameFi: "Z", name: "A" });
  const helsinkiLater = pin({ id: "c", city: "Helsinki", nameFi: "Mäkelä", name: "A" });
  const helsinkiFirst = pin({ id: "a", city: "Helsinki", nameFi: "Kallio", name: "Z" });

  expect(withDistance([espoo, helsinkiLater, helsinkiFirst], null).map((item) => item.id)).toEqual([
    "b",
    "a",
    "c",
  ]);

  const near = pin({ id: "far-id", ...withinPad });
  const far = pin({ id: "near-id", ...clearOfPad });
  expect(withDistance([far, near], here).map((item) => item.id)).toEqual(["far-id", "near-id"]);
});

test("labels known codes, title-cases an unknown hyphenated code, and joins an address", () => {
  const copy = getCopy("fi");
  expect(formatSurface("asphalt", copy)).toBe(copy.surfaces.asphalt);
  expect(formatSurface("brand-new-surface", copy)).toBe("Brand New Surface");
  expect(formatStatus("pending", copy)).toBe(copy.statusPending);
  expect(formatStatus("mystery", copy)).toBe(copy.statusUnknown);
  expect(formatReportedBoolean(null, copy)).toBe(copy.notReported);
  expect(formatAddress(["Helsinginkatu 1", null, "Helsinki"])).toBe("Helsinginkatu 1, Helsinki");
});

test("treats a court as awaiting email only before the link is opened", () => {
  expect(
    isAwaitingEmail(
      pin({ id: "1", source: "pending", emailConfirmed: false, createdAt: "2026-01-01" }),
    ),
  ).toBe(true);
  expect(
    isAwaitingEmail(
      pin({ id: "1", source: "pending", emailConfirmed: true, createdAt: "2026-01-01" }),
    ),
  ).toBe(false);
  expect(isAwaitingEmail(pin({ id: "1" }))).toBe(false);
});
