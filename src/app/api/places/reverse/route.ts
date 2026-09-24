import { reverseAddress } from "@/lib/places";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ address: null });
  }
  const address = await reverseAddress(lat, lon);
  return Response.json({ address });
}
