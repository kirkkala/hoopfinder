import { z } from "zod";
import { getAuthSession } from "@/auth";
import { loadCourtById } from "@/lib/court-page";
import { siteOrigin } from "@/lib/site-origin";
import {
  courtAsPublished,
  courtEditChanges,
  courtSubmissionIp,
  createCourtEdit,
  takeCourtSubmissionSlot,
} from "@/lib/submitted-courts";

const CourtEditSchema = z.object({
  courtId: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)).optional(),
  name: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = CourtEditSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const loaded = await loadCourtById(parsed.data.courtId);
    if (!loaded || loaded.editOf) {
      return Response.json({ error: "not-found" }, { status: 404 });
    }
    const published = await courtAsPublished(loaded.court);
    const changes = courtEditChanges(published, {
      name: parsed.data.name,
      address: parsed.data.address,
      details: parsed.data.details ?? null,
    });
    if (!changes) {
      return Response.json({ error: "unchanged" }, { status: 400 });
    }

    const session = await getAuthSession();
    const admin = session?.user?.isAdmin === true;
    const email = admin ? session?.user?.email?.trim().toLowerCase() : parsed.data.email;
    if (!email) {
      return Response.json({ error: "invalid" }, { status: 400 });
    }
    if (admin) {
      const saved = await createCourtEdit(published, email, changes, siteOrigin(request), {
        publish: true,
      });
      if ("error" in saved) {
        return Response.json({ error: saved.error }, { status: 503 });
      }
      return Response.json({ ok: true, published: true }, { status: 201 });
    }

    if (process.env.NODE_ENV !== "development") {
      const allowed = await takeCourtSubmissionSlot(courtSubmissionIp(request));
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

    const result = await createCourtEdit(published, email, changes, siteOrigin(request));
    if ("error" in result) {
      const status = result.error === "email" || result.error === "unavailable" ? 503 : 400;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
