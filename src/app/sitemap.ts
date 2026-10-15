import type { MetadataRoute } from "next";
import { getCourtCatalog } from "@/lib/catalog";
import { COURT_INDEX_PATH, SITE_URL } from "@/lib/constants";
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
    {
      url: `${SITE_URL}${COURT_INDEX_PATH}`,
      lastModified: catalogUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...courts.flatMap((court) =>
      (court.members ?? [court]).map((page) => ({
        url: `${SITE_URL}${courtHref(page)}`,
        lastModified:
          page.source === "submitted"
            ? catalogUpdated
            : (fetchedAtBySource[page.source] ?? catalogUpdated),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ),
  ];
}

function latestTimestamp(values: Array<string | undefined>): string | undefined {
  const dates = values.filter((value): value is string => Boolean(value)).sort();
  return dates.at(-1);
}
