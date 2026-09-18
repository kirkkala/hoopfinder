import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bebas_Neue, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { APP_NAME, SITE_URL } from "@/lib/constants";
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
const description = finnish.metaDescription;

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description,
  applicationName: APP_NAME,
  category: "sports",
  keywords: [
    "koripallo",
    "ulkokoripallokenttä",
    "basketball",
    "outdoor court",
    "Suomi",
    "Finland",
    "Hoop Finder",
  ],
  authors: [{ name: "Timo Kirkkala", url: "https://kirkkala.com" }],
  creator: "Timo Kirkkala",
  publisher: APP_NAME,
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
    siteName: APP_NAME,
    title: APP_NAME,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description,
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
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
