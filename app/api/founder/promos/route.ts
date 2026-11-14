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
    const database = getDatabase();
    const rows = await database.prepare(`SELECT id, title, message, locale, theme, questions_json, active, created_at, updated_at FROM founder_public_messages ORDER BY created_at DESC LIMIT 100`).all<PromoRow>();
    const responseRows = await database.prepare(`SELECT id, message_id, respondent_name, answers_json, locale, country, device, created_at FROM founder_public_message_responses WHERE message_id IN (SELECT id FROM founder_public_messages ORDER BY created_at DESC LIMIT 100) ORDER BY created_at DESC`).all<PromoResponseRow>();
    const accessRows = await database.prepare(`SELECT message_id, day, locale, country, device, referrer_host, access_count, last_access_at FROM founder_public_message_access_daily WHERE message_id IN (SELECT id FROM founder_public_messages ORDER BY created_at DESC LIMIT 100) ORDER BY day DESC, access_count DESC`).all<PromoAccessRow>();
    const accessByMessage = new Map<string, PromoAccessRow[]>();
    for (const access of accessRows.results) {
      const current = accessByMessage.get(access.message_id) || [];
      current.push(access);
      accessByMessage.set(access.message_id, current);
    }
    const responsesByMessage = new Map<string, PromoResponseRow[]>();
    for (const response of responseRows.results) responsesByMessage.set(response.message_id, [...(responsesByMessage.get(response.message_id) || []), response]);
    const messages = rows.results.map((message) => ({ ...message, questions: parseQuestions(message.questions_json), access: summarizeAccess(accessByMessage.get(message.id) || []), responses: (responsesByMessage.get(message.id) || []).map((response) => ({ id: response.id, name: response.respondent_name, answers: parseQuestions(response.answers_json), locale: response.locale, country: response.country, device: response.device, createdAt: response.created_at })) }));
    return NextResponse.json({ messages }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("founder-public-messages-list", error);
    return NextResponse.json({ error: "Public messages unavailable." }, { status: 500 });
  }
}

type PromoRow = { id: string; title: string; message: string; locale: string; theme: string; questions_json: string; active: number; created_at: string; updated_at: string };
type PromoResponseRow = { id: string; message_id: string; respondent_name: string; answers_json: string; locale: string; country: string; device: string; created_at: string };
type PromoAccessRow = { message_id: string; day: string; locale: string; country: string; device: string; referrer_host: string; access_count: number; last_access_at: string };
type AccessItem = { label: string; count: number };
type AccessSummary = { views: number; activeDays: number; lastAccessAt: string | null; countries: AccessItem[]; languages: AccessItem[]; devices: AccessItem[]; referrers: AccessItem[] };

function parseQuestions(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 12) : []; } catch { return []; }
}

function normalizeQuestions(value: unknown) {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n/) : [];
  return [...new Set(raw.map((item) => clean(item, 180)).filter(Boolean))].slice(0, 12);
}

function summarizeAccess(rows: PromoAccessRow[]): AccessSummary {
  const sum = (field: keyof Pick<PromoAccessRow, "country" | "locale" | "device" | "referrer_host">) => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row[field], (counts.get(row[field]) || 0) + Number(row.access_count || 0));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
  };
  return {
    views: rows.reduce((total, row) => total + Number(row.access_count || 0), 0),
    activeDays: new Set(rows.map((row) => row.day)).size,
    lastAccessAt: rows.map((row) => row.last_access_at).sort().at(-1) || null,
    countries: sum("country"),
    languages: sum("locale"),
    devices: sum("device"),
    referrers: sum("referrer_host"),
  };
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request, "founder-public-messages");
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const title = clean(body.title, 80, "Z4SK");
    const message = clean(body.message, 320);
    const questions = normalizeQuestions(body.questions);
    const locale = normalizeLocale(body.locale);
    const theme = normalizeTheme(body.theme);
    const count = Math.min(50, Math.max(1, Number.isFinite(Number(body.count)) ? Math.floor(Number(body.count)) : 1));
    if (!message || questions.length < 3) return NextResponse.json({ error: "Add at least 3 public questions." }, { status: 400 });
    const now = new Date().toISOString();
    const statements = Array.from({ length: count }, () => getDatabase().prepare(`INSERT INTO founder_public_messages (id, title, message, locale, theme, questions_json, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`).bind(randomToken(9), title, message, locale, theme, JSON.stringify(questions), now, now));
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
    const questions = normalizeQuestions(body.questions);
    const locale = normalizeLocale(body.locale);
    const theme = normalizeTheme(body.theme);
    if (!id || !message || questions.length < 3) return NextResponse.json({ error: "An ID, message and at least 3 questions are required." }, { status: 400 });
    const result = await getDatabase().prepare(`UPDATE founder_public_messages SET title = ?, message = ?, locale = ?, theme = ?, questions_json = ?, updated_at = ? WHERE id = ?`).bind(title, message, locale, theme, JSON.stringify(questions), new Date().toISOString(), id).run();
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
    const responseId = clean(body.responseId, 64);
    if (responseId) {
      const result = await getDatabase().prepare(`DELETE FROM founder_public_message_responses WHERE id = ?`).bind(responseId).run();
      if (!result.meta.changes) return NextResponse.json({ error: "Answer not found." }, { status: 404 });
      return NextResponse.json({ ok: true, deleted: "response" }, { headers: { "cache-control": "no-store" } });
    }
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
