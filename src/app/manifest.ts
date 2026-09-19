import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";
import { getCopy } from "@/lib/copy";

export default function manifest(): MetadataRoute.Manifest {
  const finnish = getCopy("fi");
  return {
    name: finnish.appName,
    short_name: APP_NAME,
    description: finnish.metaDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#07070a",
    theme_color: "#07070a",
    lang: "fi",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
