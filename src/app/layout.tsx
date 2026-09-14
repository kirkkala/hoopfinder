import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { Bebas_Neue, Outfit } from "next/font/google";
import type { Metadata } from "next";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { APP_NAME } from "@/lib/constants";
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

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: `${finnish.tagline} ${finnish.metaDescription}`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fi" className={`${outfit.variable} ${bebas.variable}`}>
      <body className="min-h-dvh bg-asphalt font-sans text-ink antialiased">
        <LocaleProvider>{children}</LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
