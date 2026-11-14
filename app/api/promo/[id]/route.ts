import { NextResponse } from "next/server";
import { checkRateLimit, ensureSchema, getDatabase, getRequestCountry, randomToken } from "../../../../db/runtime";

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function parseQuestions(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 12) : []; } catch { return []; }
}

function device(value: string | null) {
  const ua = String(value || "").toLowerCase();
  if (/ipad|tablet|android(?!.*mobile)/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android/.test(ua)) return "mobile";
  return "desktop";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const row = await getDatabase().prepare(`SELECT id, title, message, locale, theme, questions_json FROM founder_public_messages WHERE id = ? AND active = 1`).bind(clean(id, 64)).first<{ id: string; title: string; message: string; locale: string; theme: string; questions_json: string }>();
    if (!row) return NextResponse.json({ error: "Public questionnaire not found." }, { status: 404 });
    return NextResponse.json({ id: row.id, title: row.title, message: row.message, locale: row.locale, theme: row.theme, questions: parseQuestions(row.questions_json) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("public-quiz-read", error);
    return NextResponse.json({ error: "Public questionnaire unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const respondentName = clean(body.respondentName, 80);
    const answers = Array.isArray(body.answers) ? body.answers.map((answer) => clean(answer, 1000)) : [];
    const row = await getDatabase().prepare(`SELECT questions_json FROM founder_public_messages WHERE id = ? AND active = 1`).bind(clean(id, 64)).first<{ questions_json: string }>();
    const questions = row ? parseQuestions(row.questions_json) : [];
    if (!row || !respondentName || questions.length < 3 || answers.length !== questions.length || answers.some((answer) => !answer)) return NextResponse.json({ error: "A name and one answer per question are required." }, { status: 400 });
    const rateLimit = await checkRateLimit(request, `public-quiz:${id}`, 5, 10);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Too many answers. Try again shortly." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
    const locale = String(request.headers.get("accept-language") || "unknown").split(",")[0].split("-")[0].toLowerCase().slice(0, 12) || "unknown";
    await getDatabase().prepare(`INSERT INTO founder_public_message_responses (id, message_id, respondent_name, answers_json, locale, country, device, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(randomToken(12), id, respondentName, JSON.stringify(answers), locale, getRequestCountry(request), device(request.headers.get("user-agent")), new Date().toISOString()).run();
    return NextResponse.json({ ok: true }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("public-quiz-response", error);
    return NextResponse.json({ error: "Could not send your answers." }, { status: 500 });
  }
}
