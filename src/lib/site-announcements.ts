import type { SiteBannerMessage } from "@/components/brand/SiteBanner";

/**
 * Site-wide info banners. Add an entry to show it, delete it to hide it.
 * These stay hidden while the database is down — see the root layout.
 */
export const siteAnnouncements: SiteBannerMessage[] = [
  {
    tone: "notice",
    fi: "Uutta Hoop Finderissä: Kentän sivulle voi nyt lisätä kuvia. Auta tekemään palvelusta parempi!",
    en: "New in Hoop Finder: You can now add photos to court pages. Help make the service better!",
  },
];
