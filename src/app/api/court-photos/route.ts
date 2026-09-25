import { addCourtPhoto, type CourtPhotoError } from "@/lib/court-photos";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const courtId = form.get("courtId");
  const file = form.get("file");
  if (typeof courtId !== "string" || courtId.length === 0 || courtId.length > 80) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const result = await addCourtPhoto(courtId, file);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: statusFor(result.error) });
  }
  return Response.json(result.photo, { status: 201 });
}

function statusFor(error: CourtPhotoError): number {
  if (error === "unavailable") return 503;
  if (error === "full") return 409;
  return 400;
}
