import { NextResponse } from "next/server";
import { ensureSchema, getDatabase, randomToken } from "../../../../db/runtime";
import { authorizeFounder } from "../../../lib/founder-auth";

const THEMES = new Set(["original", "nightlife", "creator", "ocean", "solar", "aurora", "copper"]);

function clean(value: unknown, maximum: number, fallback = "") {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : fallback;
}

function normalizeTheme(value: unknown) {
  const theme = clean(value, 24, "original");
  return THEMES.has(theme) ? theme : "original";
}

function normalizeLocale(value: unknown) {
  const locale = clean(value, 12, "en");
  return /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(locale) ? locale : "en";
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request, "founder-public-messages");
    if (denied) return denied;
    const rows = await getDatabase().prepare(`SELECT id, title, message, locale, theme, active, created_at, updated_at FROM founder_public_messages ORDER BY created_at DESC LIMIT 100`).all();
    return NextResponse.json({ messages: rows.results }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("founder-public-messages-list", error);
    return NextResponse.json({ error: "Public messages unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request, "founder-public-messages");
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const title = clean(body.title, 80, "Z4SK");
    const message = clean(body.message, 320);
    const locale = normalizeLocale(body.locale);
    const theme = normalizeTheme(body.theme);
    const count = Math.min(50, Math.max(1, Number.isFinite(Number(body.count)) ? Math.floor(Number(body.count)) : 1));
    if (!message) return NextResponse.json({ error: "Write a public message first." }, { status: 400 });
    const now = new Date().toISOString();
    const statements = Array.from({ length: count }, () => getDatabase().prepare(`INSERT INTO founder_public_messages (id, title, message, locale, theme, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`).bind(randomToken(9), title, message, locale, theme, now, now));
    await getDatabase().batch(statements);
    return NextResponse.json({ ok: true, created: count }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("founder-public-messages-create", error);
    return NextResponse.json({ error: "Could not create public messages." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request, "founder-public-messages");
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const id = clean(body.id, 64);
    const title = clean(body.title, 80, "Z4SK");
    const message = clean(body.message, 320);
    const locale = normalizeLocale(body.locale);
    const theme = normalizeTheme(body.theme);
    if (!id || !message) return NextResponse.json({ error: "A message ID and public message are required." }, { status: 400 });
    const result = await getDatabase().prepare(`UPDATE founder_public_messages SET title = ?, message = ?, locale = ?, theme = ?, updated_at = ? WHERE id = ?`).bind(title, message, locale, theme, new Date().toISOString(), id).run();
    if (!result.meta.changes) return NextResponse.json({ error: "Public message not found." }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("founder-public-messages-update", error);
    return NextResponse.json({ error: "Could not update the public message." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request, "founder-public-messages");
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const id = clean(body.id, 64);
    if (!id) return NextResponse.json({ error: "A message ID is required." }, { status: 400 });
    const result = await getDatabase().prepare(`UPDATE founder_public_messages SET active = 0, updated_at = ? WHERE id = ?`).bind(new Date().toISOString(), id).run();
    if (!result.meta.changes) return NextResponse.json({ error: "Public message not found." }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("founder-public-messages-disable", error);
    return NextResponse.json({ error: "Could not disable the public message." }, { status: 500 });
  }
}
