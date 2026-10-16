import type { Metadata } from "next";
import { cookies } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";
import { HomeView } from "@/components/brand/HomeView";
import { getCourtCatalog } from "@/lib/catalog";
import { INFO_PARAM, SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { homeOgHref, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { countPublicCourts } from "@/lib/submitted-courts";
import { homeEntryTarget, VISITED_COOKIE } from "@/lib/visit";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const courtCount = await countPublicCourts();
  const finnish = getCopy("fi");
  return {
    description: finnish.metaDescriptionCount(courtCount),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      images: [
        {
          url: homeOgHref(),
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          alt: finnish.metaOgImageAlt,
          type: OG_CONTENT_TYPE,
        },
      ],
    },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const entry = homeEntryTarget({
    visited: cookieStore.get(VISITED_COOKIE)?.value === "1",
    showHome: params[INFO_PARAM] !== undefined,
    court: single(params.court),
    thanks: single(params.thanks) === "1",
  });
  if (entry?.permanent) permanentRedirect(entry.href);
  if (entry) redirect(entry.href);

  const [{ fetchedAtBySource }, courtCount] = await Promise.all([
    getCourtCatalog(),
    countPublicCourts(),
  ]);
  const finnish = getCopy("fi");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: finnish.appName,
    url: SITE_URL,
    description: finnish.metaDescriptionCount(courtCount),
    inLanguage: ["fi", "en"],
    author: {
      "@type": "Person",
      name: "Timo Kirkkala",
      url: "https://kirkkala.com",
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is built from our own site copy
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeView fetchedAtBySource={fetchedAtBySource} />
    </>
  );
}

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
