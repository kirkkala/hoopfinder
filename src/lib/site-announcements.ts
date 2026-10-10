import type { SiteBannerMessage } from "@/components/brand/SiteBanner";

/**
 * Site-wide info banners. Add an entry to show it, delete it to hide it.
 * These stay hidden while the database is down — see the root layout.
 */
export const siteAnnouncements: SiteBannerMessage[] = [
  {
    tone: "notice",
    dismissible: true,
    fi: "Uutta: Kävijät voivat lisätä kuvia kentille. Auta tekemään palvelusta parempi!",
    en: "New: Visitors can add photos to courts. Help make the service better!",
  },
];
