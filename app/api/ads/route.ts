import { NextResponse } from "next/server";
import { checkRateLimit, ensureSchema, getDatabase } from "../../../db/runtime";

type SponsorRow = { enabled: number; label: string; headline: string; cta_label: string; destination_url: string; updated_at: string };
const eventTypes = new Set(["impression", "click"]);
const placements = new Set(["invitation", "completion", "dashboard"]);
const locales = new Set(["en", "es", "it", "fr", "de", "nl", "eo", "pt", "zh", "hi", "ja", "tr", "machine"]);

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function GET() {
  try {
    await ensureSchema();
    const row = await getDatabase().prepare(`SELECT enabled, label, headline, cta_label, destination_url, updated_at FROM sponsor_config WHERE id='primary'`).first<SponsorRow>();
    return NextResponse.json(row?.enabled ? { enabled: true, label: row.label, headline: row.headline, ctaLabel: row.cta_label, destinationUrl: row.destination_url, campaignVersion: row.updated_at } : { enabled: false }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("public-ad-config", error);
    return NextResponse.json({ enabled: false }, { headers: { "cache-control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const eventType = clean(body.eventType, 16);
    const placement = clean(body.placement, 20);
    const locale = clean(body.locale, 8);
    const campaignVersion = clean(body.campaignVersion, 40);
    if (!eventTypes.has(eventType) || !placements.has(placement) || !locales.has(locale) || !campaignVersion) return new Response(null, { status: 400 });
    await ensureSchema();
    const rateLimit = await checkRateLimit(request, `sponsor-${eventType}`, 120, 10);
    if (!rateLimit.allowed) return new Response(null, { status: 204 });
    const db = getDatabase();
    const active = await db.prepare(`SELECT 1 AS active FROM sponsor_config WHERE id='primary' AND enabled=1 AND updated_at=?`).bind(campaignVersion).first<{ active: number }>();
    if (!active) return new Response(null, { status: 204 });
    const day = new Date().toISOString().slice(0, 10);
    await db.prepare(`INSERT INTO sponsor_events (campaign_version, day, event_type, placement, locale, event_count) VALUES (?, ?, ?, ?, ?, 1) ON CONFLICT(campaign_version, day, event_type, placement, locale) DO UPDATE SET event_count=sponsor_events.event_count+1`).bind(campaignVersion, day, eventType, placement, locale).run();
    return new Response(null, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("public-ad-event", error);
    return new Response(null, { status: 500 });
  }
}
