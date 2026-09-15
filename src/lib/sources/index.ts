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
    href: "https://www.openstreetmap.org/copyright",
    required: false,
    listingUrl: (id: string) => {
      const match = /^osm-(node|way|relation)-(\d+)$/.exec(id);
      return match ? `https://www.openstreetmap.org/${match[1]}/${match[2]}` : null;
    },
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
