import { z } from "zod";
import { requireAdmin } from "@/auth";
import { siteOrigin } from "@/lib/site-origin";
import {
  deleteSubmittedCourt,
  setSubmittedCourtStatus,
  SubmittedCourtSchema,
  updateSubmittedCourt,
} from "@/lib/submitted-courts";

const UpdateSchema = SubmittedCourtSchema.omit({ lat: true, lon: true });

const StatusSchema = z.object({
  status: z.enum(["pending", "published"]),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/courts/[id]">,
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "not-found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = StatusSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const result = await setSubmittedCourtStatus(
      id,
      parsed.data.status,
      siteOrigin(request),
    );
    if ("error" in result) {
      const status =
        result.error === "unavailable" || result.error === "email" ? 503 : 404;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/courts/[id]">,
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "not-found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const result = await updateSubmittedCourt(id, parsed.data);
    if ("error" in result) {
      const status = result.error === "unavailable" ? 503 : 404;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/courts/[id]">,
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "not-found" }, { status: 404 });
  }

  try {
    const result = await deleteSubmittedCourt(id);
    if ("error" in result) {
      const status = result.error === "unavailable" ? 503 : 404;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
