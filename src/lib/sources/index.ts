export type OsmElementType = "node" | "way" | "relation";

export function parseOsmCourtId(
  id: string,
): { type: OsmElementType; osmId: string } | null {
  const match = /^(node|way|relation)-(\d+)$/.exec(id);
  if (!match) return null;
  return { type: match[1] as OsmElementType, osmId: match[2] };
}

export const COURT_SOURCES = [
  {
    id: "lipas",
    label: "LIPAS",
    shortLabel: "LIPAS",
    href: "https://www.lipas.fi",
    required: true,
    listingUrl: (id: string) => `https://www.lipas.fi/liikuntapaikat/${id}`,
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    shortLabel: "OSM",
    href: "https://www.openstreetmap.org/about",
    required: false,
    listingUrl: (id: string) => {
      const parsed = parseOsmCourtId(id);
      return parsed
        ? `https://www.openstreetmap.org/${parsed.type}/${parsed.osmId}`
        : null;
    },
  },
] as const;

export const DATA_CREDITS = [
  ...COURT_SOURCES.map((source) => ({
    id: source.id,
    label: source.label,
    href: source.href,
  })),
  {
    id: "nominatim",
    label: "Nominatim",
    href: "https://nominatim.org/",
  },
] as const;

export type CourtSourceId = (typeof COURT_SOURCES)[number]["id"];

export function courtSource(id: string) {
  return COURT_SOURCES.find((source) => source.id === id);
}

export function sourceListingUrl(sourceId: string, courtId: string): string | null {
  const source = courtSource(sourceId);
  return source?.listingUrl(courtId) ?? null;
}
