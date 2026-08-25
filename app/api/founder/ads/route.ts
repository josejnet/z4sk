import { NextResponse } from "next/server";
import { ensureSchema, getDatabase } from "../../../../db/runtime";
import { authorizeFounder } from "../../../lib/founder-auth";

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

export async function PATCH(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request, "founder-ads");
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const enabled = body.enabled === true;
    const label = clean(body.label, 32) || "Sponsor";
    const headline = clean(body.headline, 120);
    const ctaLabel = clean(body.ctaLabel, 32);
    const destinationUrl = clean(body.destinationUrl, 500);
    let parsed: URL | null = null;
    try { parsed = new URL(destinationUrl); } catch { /* Reported below when the placement is enabled. */ }
    if (enabled && (!headline || !ctaLabel || !parsed || parsed.protocol !== "https:")) return NextResponse.json({ error: "An active placement needs text, a CTA and a valid HTTPS destination." }, { status: 400 });
    await getDatabase().prepare(`INSERT INTO sponsor_config (id, enabled, label, headline, cta_label, destination_url, updated_at) VALUES ('primary', ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled, label=excluded.label, headline=excluded.headline, cta_label=excluded.cta_label, destination_url=excluded.destination_url, updated_at=excluded.updated_at`).bind(enabled ? 1 : 0, label, headline, ctaLabel, parsed?.protocol === "https:" ? parsed.toString() : "", new Date().toISOString()).run();
    return NextResponse.json({ ok: true, enabled, label, headline, ctaLabel, destinationUrl: parsed?.protocol === "https:" ? parsed.toString() : "" }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("founder-ad-config", error);
    return NextResponse.json({ error: "Could not save the sponsor placement." }, { status: 500 });
  }
}
