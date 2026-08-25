import { NextResponse } from "next/server";
import { ensureSchema, getDatabase } from "../../../db/runtime";

type SponsorRow = { enabled: number; label: string; headline: string; cta_label: string; destination_url: string };

export async function GET() {
  try {
    await ensureSchema();
    const row = await getDatabase().prepare(`SELECT enabled, label, headline, cta_label, destination_url FROM sponsor_config WHERE id='primary'`).first<SponsorRow>();
    return NextResponse.json(row?.enabled ? { enabled: true, label: row.label, headline: row.headline, ctaLabel: row.cta_label, destinationUrl: row.destination_url } : { enabled: false }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("public-ad-config", error);
    return NextResponse.json({ enabled: false }, { headers: { "cache-control": "no-store" } });
  }
}
