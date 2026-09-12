import "./globals.css";
import { Bebas_Neue, Outfit } from "next/font/google";
import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_TAGLINE} Outdoor basketball courts in Finland, built for junior players.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${bebas.variable}`}>
      <body className="min-h-dvh bg-asphalt font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
