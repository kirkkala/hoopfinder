import { FeedbackSchema, isBotFeedback } from "@/lib/feedback";
import { createFeedback, feedbackClientIp, takeFeedbackSlot } from "@/lib/feedback-store";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // Same response as a real save, so a bot does not learn that the field mattered.
  if (isBotFeedback(parsed.data.company)) {
    return Response.json({ ok: true }, { status: 201 });
  }

  // `next dev` is one shared address, and local testing often exceeds the hourly cap.
  if (process.env.NODE_ENV !== "development") {
    const allowed = await takeFeedbackSlot(feedbackClientIp(request));
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

  try {
    const result = await createFeedback({
      title: parsed.data.title,
      body: parsed.data.body,
      email: parsed.data.email === "" ? null : parsed.data.email,
    });
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 503 });
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
