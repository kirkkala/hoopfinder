import { z } from "zod";
import type { Court } from "@/lib/courts";

const LIPAS_API = process.env.LIPAS_API_BASE ?? "https://api.lipas.fi/v2";
const BASKETBALL_TYPE_CODE = 1310;
const PAGE_SIZE = 100;

const LipasListSchema = z.object({
  items: z.array(z.unknown()),
  pagination: z.object({
    "total-pages": z.number(),
  }),
});

const LipasSiteSchema = z.looseObject({
  "lipas-id": z.number(),
  name: z.string(),
  "name-localized": z.looseObject({ en: z.string().optional() }).optional().nullable(),
  status: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  www: z.string().optional().nullable(),
  "construction-year": z.number().optional().nullable(),
  owner: z.string().optional().nullable(),
  admin: z.string().optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional().nullable(),
  "search-meta": z
    .looseObject({
      location: z
        .looseObject({
          city: z
            .looseObject({
              name: z.looseObject({ fi: z.string().optional().nullable() }).optional().nullable(),
            })
            .optional()
            .nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
  location: z.looseObject({
    address: z.string().optional().nullable(),
    "postal-code": z.string().optional().nullable(),
    "postal-office": z.string().optional().nullable(),
    city: z
      .looseObject({
        "city-code": z.number().optional().nullable(),
        neighborhood: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
    geometries: z.unknown().optional().nullable(),
  }),
});

const LipasMunicipalitySchema = z.object({
  "search-meta": z
    .looseObject({
      location: z
        .looseObject({
          city: z
            .looseObject({
              name: z.looseObject({ fi: z.string().optional().nullable() }).optional().nullable(),
            })
            .optional()
            .nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});

type LipasSite = z.infer<typeof LipasSiteSchema>;

export async function getLipasCourts(): Promise<Court[]> {
  const first = await fetchPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.pagination["total-pages"] - 1, 0) }, (_, i) =>
      fetchPage(i + 2),
    ),
  );

  const sites: LipasSite[] = [];
  for (const page of [first, ...rest]) {
    for (const item of page.items) {
      const parsed = LipasSiteSchema.safeParse(item);
      if (parsed.success) sites.push(parsed.data);
    }
  }

  const municipalities = await municipalityNames(sites);
  const courts: Court[] = [];
  for (const site of sites) {
    const court = toCourt(site, municipalities);
    if (court) courts.push(court);
  }
  return courts;
}

async function fetchPage(page: number) {
  const url = new URL(`${LIPAS_API}/sports-sites`);
  url.searchParams.set("type-codes", String(BASKETBALL_TYPE_CODE));
  url.searchParams.set("statuses", "active,out-of-service-temporarily");
  url.searchParams.set("page-size", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`LIPAS list request failed with ${response.status}`);
  }

  const parsed = LipasListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("LIPAS list payload failed validation");
  }
  return parsed.data;
}

/**
 * List rows omit the municipality name. One site per city code is enough;
 * search-meta on that site carries the Finnish kunta name.
 */
async function municipalityNames(sites: LipasSite[]): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  const sampleId = new Map<number, number>();

  for (const site of sites) {
    if (!coordinates(site)) continue;
    const code = site.location.city?.["city-code"];
    if (typeof code !== "number") continue;
    const known = text(site["search-meta"]?.location?.city?.name?.fi);
    if (known) names.set(code, known);
    if (!text(site.location["postal-office"]) && !sampleId.has(code)) {
      sampleId.set(code, site["lipas-id"]);
    }
  }

  await Promise.all(
    [...sampleId]
      .filter(([code]) => !names.has(code))
      .map(async ([code, id]) => {
        const name = await fetchMunicipalityName(id);
        if (name) names.set(code, name);
      }),
  );
  return names;
}

async function fetchMunicipalityName(id: number): Promise<string | null> {
  const response = await fetch(`${LIPAS_API}/sports-sites/${id}`, { cache: "no-store" });
  if (!response.ok) return null;
  const parsed = LipasMunicipalitySchema.safeParse(await response.json());
  if (!parsed.success) return null;
  return text(parsed.data["search-meta"]?.location?.city?.name?.fi);
}

/**
 * Postitoimipaikka is the locality when Lipas has one (Halikko stays Halikko).
 * Otherwise the municipality name fills the city, and a distinct kuntaosa stays
 * on the address. A kuntaosa that only repeats the city is dropped, and its
 * normal spelling replaces an all-caps postal place.
 */
function lipasPlace(
  site: LipasSite,
  municipalities: Map<number, string>,
): { city: string | null; neighborhood: string | null } {
  const postalOffice = text(site.location["postal-office"]);
  const code = site.location.city?.["city-code"];
  const municipality = typeof code === "number" ? text(municipalities.get(code)) : null;
  const district = text(site.location.city?.neighborhood);
  const city = postalOffice ?? municipality ?? district;
  if (district && city && sameLabel(district, city)) {
    // Kuntaosa often repeats the postal place in normal spelling (Myllyoja vs MYLLYOJA).
    return { city: preferredSpelling(city, district), neighborhood: null };
  }
  return { city, neighborhood: district };
}

function preferredSpelling(primary: string, alternate: string): string {
  if (isUppercase(primary) && !isUppercase(alternate)) return alternate;
  return primary;
}

function isUppercase(value: string): boolean {
  return value === value.toLocaleUpperCase("fi") && value !== value.toLocaleLowerCase("fi");
}

function sameLabel(a: string, b: string): boolean {
  return a.localeCompare(b, "fi", { sensitivity: "accent" }) === 0;
}

function coordinates(site: LipasSite): { lat: number; lon: number } | null {
  const pair = (
    site.location.geometries as
      | { features?: Array<{ geometry?: { coordinates?: number[] } }> }
      | null
      | undefined
  )?.features?.[0]?.geometry?.coordinates;
  const lon = pair?.[0];
  const lat = pair?.[1];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  return { lat, lon };
}

function toCourt(site: LipasSite, municipalities: Map<number, string>): Court | null {
  const point = coordinates(site);
  if (!point) return null;

  const properties = site.properties ?? {};
  const place = lipasPlace(site, municipalities);
  return {
    id: String(site["lipas-id"]),
    source: "lipas",
    name: site["name-localized"]?.en?.trim() || site.name,
    nameFi: site.name,
    status: site.status ?? "unknown",
    address: text(site.location.address),
    postalCode: text(site.location["postal-code"]),
    city: place.city,
    neighborhood: place.neighborhood,
    lat: point.lat,
    lon: point.lon,
    comment: text(site.comment),
    website: text(site.www),
    constructionYear: site["construction-year"] ?? null,
    // Codes such as "foundation"; UI uses LIPAS search-meta translations.
    owner: text(site.owner),
    admin: text(site.admin),
    amenities: {
      lighting: bool(properties["ligthing?"]),
      lightingInfo: str(properties["lighting-info"]),
      freeUse: bool(properties["free-use?"]),
      schoolUse: bool(properties["school-use?"]),
      fieldType: str(properties["basketball-field-type"]),
      surfaceMaterial: Array.isArray(properties["surface-material"])
        ? properties["surface-material"].filter((item): item is string => typeof item === "string")
        : [],
      surfaceMaterialInfo: str(properties["surface-material-info"]),
      lengthM: num(properties["field-length-m"]),
      widthM: num(properties["field-width-m"]),
      areaM2: num(properties["area-m2"]),
      toilet: bool(properties["toilet?"]),
      heightAdjustable: bool(properties["height-of-basket-or-net-adjustable?"]),
      hoopHeight: null,
      waterPoint: str(properties["water-point"]),
      matchClock: bool(properties["match-clock?"]),
      scoreboard: bool(properties["scoreboard?"]),
    },
  };
}

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? text(value) : null;
}
