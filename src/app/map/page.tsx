import { permanentRedirect } from "next/navigation";
import { MAP_PATH } from "@/lib/constants";

export default async function LegacyMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.append(key, value);
    else if (value) for (const item of value) query.append(key, item);
  }
  const suffix = query.size > 0 ? `?${query}` : "";
  permanentRedirect(`${MAP_PATH}${suffix}`);
}
