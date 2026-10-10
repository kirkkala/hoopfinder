import type { SiteBannerMessage } from "@/components/brand/SiteBanner";

/**
 * Site-wide info banners. Add an entry to show it, delete it to hide it.
 * These stay hidden while the database is down — see the root layout.
 */
export const siteAnnouncements: SiteBannerMessage[] = [
  {
    tone: "notice",
    dismissible: true,
    fi: "Uutta: Olemassa oleville kentille voi nyt lisätä kuvia!",
    en: "New: Existing courts can now be added photos!",
  },
];
