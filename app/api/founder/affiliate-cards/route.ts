import { NextResponse } from "next/server";
import { ensureSchema, getDatabase, randomToken } from "../../../../db/runtime";
import { authorizeFounder } from "../../../lib/founder-auth";

const DEFAULT_COLOR = "#ff5a1f";
const ALLOWED_COLORS = new Set(["#ff5a1f", "#ff3b9d", "#7dffbf", "#52c7ff", "#ff8066", "#4fe0c0", "#e8a15d"]);

function text(value: unknown, maximum: number, fallback = "") { return typeof value === "string" ? value.trim().slice(0, maximum) : fallback; }
function array(value: unknown, maximum: number, fallback: string[]) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : fallback;
  return [...new Set(raw.map((item) => text(item, 24).toLowerCase()).filter(Boolean))].slice(0, maximum);
}
function slug(value: unknown) { return text(value, 80).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
function safeUrl(value: unknown) { try { const parsed = new URL(text(value, 500)); return parsed.protocol === "https:" ? parsed.toString() : ""; } catch { return ""; } }
function cardFromBody(body: Record<string, unknown>) {
  const languages = array(body.languages, 12, ["en", "es"]);
  const intensityTags = array(body.intensityTags, 8, ["all"]);
  const countryCodes = array(body.countryCodes, 20, []).map((item) => item.toUpperCase());
  return { slug: slug(body.slug), title: text(body.title, 120), description: text(body.description, 300), ctaText: text(body.ctaText, 48, "Descubrir"), affiliateUrl: safeUrl(body.affiliateUrl), badgeText: text(body.badgeText, 48), accentColor: ALLOWED_COLORS.has(text(body.accentColor, 16)) ? text(body.accentColor, 16) : DEFAULT_COLOR, intensityTags, languages, countryCodes, weight: Math.min(100, Math.max(1, Math.floor(Number(body.weight) || 5))), active: body.active === true };
}

export async function GET(request: Request) {
  const denied = await authorizeFounder(request, "founder-affiliate-cards");
  if (denied) return denied;
  try {
    await ensureSchema();
    const rows = await getDatabase().prepare(`SELECT id, slug, title, description, cta_text, affiliate_url, badge_text, accent_color, intensity_tags, languages, country_codes, weight, active, impressions_count, clicks_count, created_at FROM affiliate_cards ORDER BY created_at DESC`).all<Record<string, unknown>>();
    return NextResponse.json({ cards: rows.results.map(serialize) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("founder-affiliate-list", error); return NextResponse.json({ error: "No se han podido cargar las campañas." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const denied = await authorizeFounder(request, "founder-affiliate-cards");
  if (denied) return denied;
  try {
    await ensureSchema();
    const draft = cardFromBody(await request.json() as Record<string, unknown>);
    if (!draft.slug || !draft.title || !draft.description || !draft.affiliateUrl) return NextResponse.json({ error: "Completa nombre, descripción y destino HTTPS." }, { status: 400 });
    const now = new Date().toISOString();
    await getDatabase().prepare(`INSERT INTO affiliate_cards (id, slug, title, description, cta_text, affiliate_url, badge_text, accent_color, intensity_tags, languages, country_codes, weight, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(randomToken(10), draft.slug, draft.title, draft.description, draft.ctaText, draft.affiliateUrl, draft.badgeText, draft.accentColor, JSON.stringify(draft.intensityTags), JSON.stringify(draft.languages), JSON.stringify(draft.countryCodes), draft.weight, draft.active ? 1 : 0, now).run();
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("founder-affiliate-create", error); return NextResponse.json({ error: "No se ha podido crear la campaña. Comprueba que el slug no esté repetido." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const denied = await authorizeFounder(request, "founder-affiliate-cards");
  if (denied) return denied;
  try {
    await ensureSchema();
    const body = await request.json() as Record<string, unknown>;
    const id = text(body.id, 80);
    if (!id) return NextResponse.json({ error: "Falta la campaña." }, { status: 400 });
    if (body.action === "resetMetrics") { await getDatabase().prepare(`UPDATE affiliate_cards SET impressions_count=0, clicks_count=0 WHERE id=?`).bind(id).run(); return NextResponse.json({ ok: true }); }
    const draft = cardFromBody(body);
    if (!draft.slug || !draft.title || !draft.description || !draft.affiliateUrl) return NextResponse.json({ error: "Completa nombre, descripción y destino HTTPS." }, { status: 400 });
    await getDatabase().prepare(`UPDATE affiliate_cards SET slug=?, title=?, description=?, cta_text=?, affiliate_url=?, badge_text=?, accent_color=?, intensity_tags=?, languages=?, country_codes=?, weight=?, active=? WHERE id=?`).bind(draft.slug, draft.title, draft.description, draft.ctaText, draft.affiliateUrl, draft.badgeText, draft.accentColor, JSON.stringify(draft.intensityTags), JSON.stringify(draft.languages), JSON.stringify(draft.countryCodes), draft.weight, draft.active ? 1 : 0, id).run();
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("founder-affiliate-update", error); return NextResponse.json({ error: "No se han podido guardar los cambios." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const denied = await authorizeFounder(request, "founder-affiliate-cards");
  if (denied) return denied;
  try { await ensureSchema(); const id = text((await request.json() as Record<string, unknown>).id, 80); await getDatabase().prepare(`DELETE FROM affiliate_cards WHERE id=?`).bind(id).run(); return NextResponse.json({ ok: true }); }
  catch (error) { console.error("founder-affiliate-delete", error); return NextResponse.json({ error: "No se ha podido eliminar la campaña." }, { status: 400 }); }
}

function parse(value: unknown) { try { const parsed = JSON.parse(String(value || "[]")); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function serialize(row: Record<string, unknown>) { return { id: row.id, slug: row.slug, title: row.title, description: row.description, ctaText: row.cta_text, affiliateUrl: row.affiliate_url, badgeText: row.badge_text, accentColor: row.accent_color, intensityTags: parse(row.intensity_tags), languages: parse(row.languages), countryCodes: parse(row.country_codes), weight: Number(row.weight || 5), active: Number(row.active) === 1, impressions: Number(row.impressions_count || 0), clicks: Number(row.clicks_count || 0), createdAt: row.created_at }; }
