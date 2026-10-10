import { requireAdmin } from "@/auth";
import { FeedbackNotesSchema } from "@/lib/feedback";
import { updateFeedbackNotes } from "@/lib/feedback-store";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/feedback/[id]">) {
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

  const parsed = FeedbackNotesSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const result = await updateFeedbackNotes(id, parsed.data.notes);
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
