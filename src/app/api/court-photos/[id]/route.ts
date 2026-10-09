import { requireAdmin } from "@/auth";
import { deleteCourtPhoto, readPublishedCourtPhoto } from "@/lib/court-photos";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thumb = new URL(request.url).searchParams.has("thumb");
  const photo = await readPublishedCourtPhoto(id, thumb ? "thumb" : "full");
  if (!photo) return new Response(null, { status: 404 });
  return new Response(Buffer.from(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const result = await deleteCourtPhoto(id);
  if ("error" in result) {
    const status = result.error === "unavailable" ? 503 : 404;
    return Response.json({ error: result.error }, { status });
  }
  return new Response(null, { status: 204 });
}
