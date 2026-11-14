import { NextResponse } from "next/server";
import { checkRateLimit, ensureSchema, recordEvent } from "../../../db/runtime";

const eventTypes = new Set([
  "builder_started",
  "builder_step_1",
  "builder_step_2",
  "builder_step_3",
  "builder_step_4",
  "builder_created",
  "invitation_shared",
  "dashboard_shared",
  "builder_theme_selected",
  "recipient_started",
  "recipient_review",
  "recipient_submitted",
]);
const locales = new Set(["en", "es", "it", "fr", "de", "nl", "eo", "pt", "zh", "hi", "ja", "tr", "machine"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventType = typeof body.eventType === "string" ? body.eventType : "";
    const locale = typeof body.locale === "string" ? body.locale : "";
    if (!eventTypes.has(eventType) || !locales.has(locale)) return new Response(null, { status: 400 });
    await ensureSchema();
    const rateLimit = await checkRateLimit(request, "funnel", 40, 60);
    if (!rateLimit.allowed) return new Response(null, { status: 204 });
    await recordEvent({ eventType, gameId: "", locale, source: "funnel" });
    return new Response(null, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("funnel-event", error);
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }
}
