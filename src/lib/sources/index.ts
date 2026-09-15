export const COURT_SOURCES = [
  {
    id: "lipas",
    label: "LIPAS",
    shortLabel: "LIPAS",
    href: "https://www.lipas.fi",
    required: true,
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    shortLabel: "OSM",
    href: "https://www.openstreetmap.org/copyright",
    required: false,
  },
] as const;

export type CourtSourceId = (typeof COURT_SOURCES)[number]["id"];

export function courtSource(id: string) {
  return COURT_SOURCES.find((source) => source.id === id);
}
