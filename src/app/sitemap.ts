import type { MetadataRoute } from "next";
import { COURT_INDEX_PATH, MAP_PATH, SITE_URL } from "@/lib/constants";
import { publicCityCourts } from "@/lib/court-index";
import { loadCourtIndex } from "@/lib/court-page";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { groups, fetchedAtBySource } = await loadCourtIndex();
  const catalogUpdated = latestTimestamp(Object.values(fetchedAtBySource));

  return [
    {
      url: SITE_URL,
      lastModified: catalogUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${MAP_PATH}`,
      lastModified: catalogUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${COURT_INDEX_PATH}`,
      lastModified: catalogUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...groups.flatMap((group) =>
      group.pageHref
        ? [
            {
              url: `${SITE_URL}${group.pageHref}`,
              lastModified: catalogUpdated,
              changeFrequency: "weekly" as const,
              priority: 0.8,
            },
          ]
        : [],
    ),
    ...groups.flatMap((group) =>
      publicCityCourts(group.courts).map((court) => ({
        url: `${SITE_URL}${court.href}`,
        lastModified:
          court.source === "lipas" || court.source === "osm"
            ? (fetchedAtBySource[court.source] ?? catalogUpdated)
            : catalogUpdated,
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
