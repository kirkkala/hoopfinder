import type { MetadataRoute } from "next";
import { getCourtCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/constants";
import { courtHref } from "@/lib/courts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  const catalogUpdated = latestTimestamp(Object.values(fetchedAtBySource));

  return [
    {
      url: SITE_URL,
      lastModified: catalogUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...courts.map((court) => ({
      url: `${SITE_URL}${courtHref(court)}`,
      lastModified:
        court.source === "submitted"
          ? catalogUpdated
          : (fetchedAtBySource[court.source] ?? catalogUpdated),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

function latestTimestamp(values: Array<string | undefined>): string | undefined {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates.at(-1);
}
