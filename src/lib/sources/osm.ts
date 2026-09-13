import { z } from "zod";
import { getCopy } from "@/lib/copy";
import { emptyAmenities, isGenericCourtName, type Court } from "@/lib/courts";

const OVERPASS_API =
  process.env.OVERPASS_API_BASE ?? "https://overpass-api.de/api/interpreter";

const QUERY = `[out:json][timeout:90];
area(3600054200)->.fi;
nwr["leisure"="pitch"]["sport"~"basketball"]["indoor"!="yes"]["location"!="indoor"](area.fi);
out center tags;`;

const OsmSchema = z.object({
  remark: z.string().optional(),
  elements: z.array(
    z.looseObject({
      type: z.enum(["node", "way", "relation"]),
      id: z.number(),
      lat: z.number().optional(),
      lon: z.number().optional(),
      center: z
        .object({
          lat: z.number(),
          lon: z.number(),
        })
        .optional(),
      tags: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

export async function getOsmCourts(): Promise<Court[]> {
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "HoopFinder/0.1 (https://github.com/kirkkala/hoopfinder)",
    },
    body: new URLSearchParams({ data: QUERY }).toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status}`);
  }

  const parsed = OsmSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Overpass payload failed validation");
  }
  if (parsed.data.remark) {
    throw new Error(`Overpass error: ${parsed.data.remark}`);
  }

  const courts: Court[] = [];
  for (const element of parsed.data.elements) {
    const court = toCourt(element);
    if (court) courts.push(court);
  }
  if (courts.length === 0) {
    throw new Error("Overpass returned no courts");
  }
  return courts;
}

function toCourt(
  element: z.infer<typeof OsmSchema>["elements"][number],
): Court | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const tags = element.tags ?? {};
  if (tags.location === "indoor") return null;

  const taggedName = text(tags["name:fi"]) || text(tags.name);
  const nameFi =
    taggedName && !isGenericCourtName(taggedName)
      ? taggedName
      : getCopy("fi").unnamedCourt;
  const taggedEn = text(tags["name:en"]);
  const name =
    taggedEn && !isGenericCourtName(taggedEn) ? taggedEn : nameFi;
  const hoops = text(tags.hoops);

  return {
    id: `osm-${element.type}-${element.id}`,
    source: "osm",
    name,
    nameFi,
    status: "active",
    address: text(tags["addr:street"])
      ? [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ")
      : null,
    postalCode: text(tags["addr:postcode"]),
    city: text(tags["addr:city"]) || text(tags["addr:municipality"]),
    neighborhood: text(tags["addr:suburb"]) || text(tags["addr:district"]),
    lat,
    lon,
    comment: text(tags.description) || text(tags.note),
    website: text(tags.website) || text(tags.url),
    constructionYear: null,
    owner: text(tags.operator) || text(tags.owner),
    admin: null,
    amenities: {
      ...emptyAmenities(),
      lighting: yesNo(tags.lit),
      freeUse: accessToFreeUse(tags.access),
      fieldType: hoops ? `${hoops} hoop${hoops === "1" ? "" : "s"}` : null,
      surfaceMaterial: text(tags.surface) ? [tags.surface] : [],
    },
  };
}

function yesNo(value: string | undefined): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function accessToFreeUse(value: string | undefined): boolean | null {
  if (!value) return null;
  if (value === "yes" || value === "public") return true;
  if (value === "private" || value === "no" || value === "customers") return false;
  return null;
}

function text(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
