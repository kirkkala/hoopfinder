import { siteOrigin } from "@/lib/site-origin";
import {
  createSubmittedCourt,
  listSubmittedCourts,
  SubmittedCourtSchema,
} from "@/lib/submitted-courts";

export async function GET() {
  try {
    const courts = await listSubmittedCourts();
    return Response.json({ courts });
  } catch (error) {
    console.error(error);
    return Response.json({ courts: [] });
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = SubmittedCourtSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const result = await createSubmittedCourt(parsed.data, siteOrigin(request));
    if ("error" in result) {
      const status =
        result.error === "unavailable" || result.error === "email"
          ? 503
          : result.error === "too-close"
            ? 409
            : 400;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
