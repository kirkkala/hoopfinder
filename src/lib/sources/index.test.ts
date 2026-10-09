import { expect, test } from "vitest";
import { parseOsmCourtId, sourceListingUrl } from "./index";

test("builds the public listing link for a Lipas id and an OSM element", () => {
  expect(sourceListingUrl("lipas", "82547")).toBe("https://www.lipas.fi/liikuntapaikat/82547");
  expect(parseOsmCourtId("way-1095396325")).toEqual({ type: "way", osmId: "1095396325" });
  expect(sourceListingUrl("osm", "way-1095396325")).toBe(
    "https://www.openstreetmap.org/way/1095396325",
  );
  expect(sourceListingUrl("osm", "82547")).toBeNull();
  expect(sourceListingUrl("nominatim", "1")).toBeNull();
});
