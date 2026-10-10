import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { getAuthSession } from "@/auth";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FeedbackProvider } from "@/components/brand/FeedbackDialog";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { SiteBanner, type SiteBannerMessage } from "@/components/brand/SiteBanner";
import { SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { isDatabaseUnavailable, withDb } from "@/lib/db";
import { siteAnnouncements } from "@/lib/site-announcements";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const finnish = getCopy("fi");
const appName = finnish.appName;
const description = finnish.metaDescription;

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description,
  applicationName: appName,
  category: "sports",
  keywords: [
    "koripallo",
    "ulkokoripallokenttä",
    "basketball",
    "outdoor court",
    "Suomi",
    "Finland",
    "Hoop Finder",
    "Hoop Finder Suomi",
    "Hoop Finder Finland",
  ],
  authors: [{ name: "Timo Kirkkala", url: "https://kirkkala.com" }],
  creator: "Timo Kirkkala",
  publisher: appName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fi_FI",
    alternateLocale: ["en_US"],
    url: SITE_URL,
    siteName: appName,
    title: appName,
    description,
  },
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black-translucent",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session] = await Promise.all([getAuthSession(), withDb((sql) => sql`select 1`)]);
  const databaseUnavailable = isDatabaseUnavailable();
  const messages: SiteBannerMessage[] = databaseUnavailable
    ? [
        {
          tone: "error",
          fi: getCopy("fi").databaseUnavailable,
          en: getCopy("en").databaseUnavailable,
        },
      ]
    : siteAnnouncements;
  return (
    <html lang="fi" className={`${outfit.variable} ${bebas.variable}`}>
      <body className="min-h-dvh bg-asphalt font-sans text-ink antialiased">
        <LocaleProvider>
          <SiteBanner messages={messages} databaseUnavailable={databaseUnavailable}>
            <AuthProvider session={session}>
              <AdminProvider isAdmin={session?.user?.isAdmin === true}>
                <FeedbackProvider>{children}</FeedbackProvider>
              </AdminProvider>
            </AuthProvider>
          </SiteBanner>
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
