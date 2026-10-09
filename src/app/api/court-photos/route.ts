import { addCourtPhoto, type CourtPhotoError, takeCourtPhotoSlot } from "@/lib/court-photos";
import { courtSubmissionIp } from "@/lib/submitted-courts";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const courtId = form.get("courtId");
  const email = form.get("email");
  const description = form.get("description");
  const file = form.get("file");
  if (typeof courtId !== "string" || courtId.length === 0 || courtId.length > 80) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (typeof email !== "string") {
    return Response.json({ error: "email" }, { status: 400 });
  }
  if (typeof description !== "string") {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // `next dev` is one shared address, and trying the form often exceeds ten an hour.
  if (process.env.NODE_ENV !== "development") {
    const allowed = await takeCourtPhotoSlot(courtSubmissionIp(request));
    if (allowed === null) {
      return Response.json({ error: "unavailable" }, { status: 503 });
    }
    if (!allowed) {
      return Response.json(
        { error: "rate-limited" },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }
  }

  const result = await addCourtPhoto(courtId, file, email, description);
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
