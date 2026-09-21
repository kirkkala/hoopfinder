import { z } from "zod";
import {
  deleteSubmittedCourt,
  setSubmittedCourtStatus,
} from "@/lib/submitted-courts";

const StatusSchema = z.object({
  status: z.enum(["pending", "published"]),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/courts/[id]">,
) {
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
    const result = await setSubmittedCourtStatus(id, parsed.data.status);
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
