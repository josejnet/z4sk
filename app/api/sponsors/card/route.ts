import { NextResponse } from "next/server";
import { getDatabase, getRequestCountry, ensureSchema } from "../../../../db/runtime";

type AffiliateRow = {
  id: string; slug: string; title: string; description: string; cta_text: string;
  badge_text: string; accent_color: string; intensity_tags: string; languages: string;
  country_codes: string; weight: number; active: number;
};

function list(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; }
  catch { return []; }
}

function normalize(value: string | null, fallback: string) {
  const clean = String(value || fallback).toLowerCase().split("-")[0].trim();
  return /^[a-z]{2,3}$/.test(clean) ? clean : fallback;
}

function weightedPick(rows: AffiliateRow[]) {
  const total = rows.reduce((sum, row) => sum + Math.max(1, Number(row.weight) || 1), 0);
  let cursor = Math.random() * total;
  return rows.find((row) => { cursor -= Math.max(1, Number(row.weight) || 1); return cursor <= 0; }) || rows[0];
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const url = new URL(request.url);
    const language = normalize(url.searchParams.get("lang"), "en");
    const intensity = normalize(url.searchParams.get("intensity"), "all");
    const country = getRequestCountry(request);
    const rows = await getDatabase().prepare(`SELECT id, slug, title, description, cta_text, badge_text, accent_color, intensity_tags, languages, country_codes, weight, active FROM affiliate_cards WHERE active=1 ORDER BY created_at DESC`).all<AffiliateRow>();
    const eligible = rows.results.filter((row) => {
      const languages = list(row.languages).map((item) => item.toLowerCase());
      const intensities = list(row.intensity_tags).map((item) => item.toLowerCase());
      const countries = list(row.country_codes).map((item) => item.toUpperCase());
      const languageMatch = languages.includes(language) || languages.includes("all");
      const intensityMatch = intensities.includes(intensity) || intensities.includes("all");
      const countryMatch = countries.length === 0 || countries.includes(country);
      return languageMatch && intensityMatch && countryMatch;
    });
    const fallback = rows.results.filter((row) => list(row.languages).some((item) => ["en", "es"].includes(item.toLowerCase())) && (list(row.intensity_tags).includes("all") || list(row.intensity_tags).includes(intensity)));
    const card = weightedPick(eligible.length ? eligible : fallback);
    if (!card) return NextResponse.json({ card: null }, { headers: { "cache-control": "no-store" } });
    void getDatabase().prepare(`UPDATE affiliate_cards SET impressions_count=impressions_count+1 WHERE id=?`).bind(card.id).run().catch(() => undefined);
    return NextResponse.json({ card: { slug: card.slug, title: card.title, description: card.description, ctaText: card.cta_text, badgeText: card.badge_text, accentColor: card.accent_color } }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("affiliate-card", error);
    return NextResponse.json({ card: null }, { headers: { "cache-control": "no-store" } });
  }
}
