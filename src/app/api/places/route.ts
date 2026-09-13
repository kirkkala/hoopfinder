import { lookupPlace } from "@/lib/places";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const bounds = await lookupPlace(query);
  return Response.json(bounds);
}
