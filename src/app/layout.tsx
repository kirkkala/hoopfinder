import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bebas_Neue, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";

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
  twitter: {
    card: "summary_large_image",
    title: appName,
    description,
  },
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fi" className={`${outfit.variable} ${bebas.variable}`}>
      <body className="min-h-dvh bg-asphalt font-sans text-ink antialiased">
        <LocaleProvider>{children}</LocaleProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
