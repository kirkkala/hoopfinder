import { z } from "zod";
import { COURT_DATA_REVALIDATE } from "@/lib/constants";
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
  "name-localized": z
    .looseObject({ en: z.string().optional() })
    .optional()
    .nullable(),
  status: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  www: z.string().optional().nullable(),
  "construction-year": z.number().optional().nullable(),
  owner: z.string().optional().nullable(),
  admin: z.string().optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional().nullable(),
  location: z.looseObject({
    address: z.string().optional().nullable(),
    "postal-code": z.string().optional().nullable(),
    "postal-office": z.string().optional().nullable(),
    city: z
      .looseObject({
        neighborhood: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
    geometries: z.unknown().optional().nullable(),
  }),
});

export async function getLipasCourts(): Promise<Court[]> {
  const first = await fetchPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.pagination["total-pages"] - 1, 0) }, (_, i) =>
      fetchPage(i + 2),
    ),
  );

  const courts: Court[] = [];
  for (const page of [first, ...rest]) {
    for (const item of page.items) {
      const parsed = LipasSiteSchema.safeParse(item);
      if (!parsed.success) continue;
      const court = toCourt(parsed.data);
      if (court) courts.push(court);
    }
  }
  return courts;
}

async function fetchPage(page: number) {
  const url = new URL(`${LIPAS_API}/sports-sites`);
  url.searchParams.set("type-codes", String(BASKETBALL_TYPE_CODE));
  url.searchParams.set("statuses", "active,out-of-service-temporarily");
  url.searchParams.set("page-size", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: COURT_DATA_REVALIDATE },
  });
  if (!response.ok) {
    throw new Error(`LIPAS list request failed with ${response.status}`);
  }

  const parsed = LipasListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("LIPAS list payload failed validation");
  }
  return parsed.data;
}

function toCourt(site: z.infer<typeof LipasSiteSchema>): Court | null {
  const coordinates = (
    site.location.geometries as
      | { features?: Array<{ geometry?: { coordinates?: number[] } }> }
      | null
      | undefined
  )?.features?.[0]?.geometry?.coordinates;
  const lon = coordinates?.[0];
  const lat = coordinates?.[1];
  if (typeof lon !== "number" || typeof lat !== "number") return null;

  const properties = site.properties ?? {};
  return {
    id: String(site["lipas-id"]),
    source: "lipas",
    name: site["name-localized"]?.en?.trim() || site.name,
    nameFi: site.name,
    status: site.status ?? "unknown",
    address: text(site.location.address),
    postalCode: text(site.location["postal-code"]),
    city: text(site.location["postal-office"]),
    // LIPAS "neighborhood" is a planning district (peruspiiri), not kaupunginosa.
    neighborhood: text(site.location.city?.neighborhood),
    lat,
    lon,
    comment: text(site.comment),
    website: text(site.www),
    constructionYear: site["construction-year"] ?? null,
    owner: titleCode(site.owner),
    admin: titleCode(site.admin),
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

function titleCode(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
