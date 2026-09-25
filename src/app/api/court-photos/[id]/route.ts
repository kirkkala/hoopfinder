import { readPublishedCourtPhoto } from "@/lib/court-photos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photo = await readPublishedCourtPhoto(id);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(Buffer.from(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
