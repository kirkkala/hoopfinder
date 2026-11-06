import type { Metadata } from "next";

/** Admin pages stay out of search results. */
export function adminMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}
