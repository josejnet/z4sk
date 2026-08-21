import { NextResponse } from "next/server";
import { bearerToken, checkRateLimit, ensureSchema, getDatabase, hashQuestion, hashToken, randomToken, recordEvent } from "../../../../../db/runtime";

type Context = { params: Promise<{ id: string }> };
type GameRow = { creator_token_hash: string; questions_json: string; locale: string; level: string; library_version: string; view_once: number; double_blind: number; creator_interest: number; closed: number; expires_at: string };

export async function POST(request: Request, context: Context) {
  try {
    await ensureSchema();
    const rateLimit = await checkRateLimit(request, "submit-response", 30, 10);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Too many responses. Try again shortly." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
    const { id } = await context.params;
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, questions_json, locale, level, library_version, view_once, double_blind, creator_interest, closed, expires_at FROM games WHERE id = ?`).bind(id).first<GameRow>();
    if (!game || game.closed || new Date(game.expires_at) < new Date()) return NextResponse.json({ error: "Este cuestionario ya no está disponible." }, { status: 404 });
    const existing = await db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id = ?`).bind(id).first<{ count: number }>();
    if (game.view_once && Number(existing?.count || 0) > 0) return NextResponse.json({ error: "Alguien ya respondió a esta invitación de una sola vez." }, { status: 409 });
    const body = await request.json() as { respondentName?: unknown; answers?: unknown; reactions?: unknown; matchInterest?: unknown };
    const questions = JSON.parse(game.questions_json) as string[];
    const respondentName = typeof body.respondentName === "string" ? body.respondentName.trim().replace(/\s+/g, " ").slice(0, 40) : "";
    const answers = Array.isArray(body.answers) ? body.answers.map((value) => typeof value === "string" ? value.trim().slice(0, 800) : "") : [];
    const allowedReactions = new Set(["", "😳", "🔥", "❤️", "😂"]);
    const reactions = Array.isArray(body.reactions) ? body.reactions.map((value) => typeof value === "string" && allowedReactions.has(value) ? value : "") : Array(questions.length).fill("");
    const matched = Boolean(game.double_blind && game.creator_interest && body.matchInterest === true);
    if (respondentName.length < 2 || answers.length !== questions.length || answers.some((answer) => !answer)) return NextResponse.json({ error: "Completa tu nombre y todas las respuestas." }, { status: 400 });
    const insert = game.view_once
      ? await db.prepare(`INSERT INTO responses (id, game_id, respondent_name, answers_json, reactions_json, matched, created_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM responses WHERE game_id = ?)`).bind(randomToken(10), id, respondentName, JSON.stringify(answers), JSON.stringify(reactions), matched ? 1 : 0, new Date().toISOString(), id).run()
      : await db.prepare(`INSERT INTO responses (id, game_id, respondent_name, answers_json, reactions_json, matched, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(randomToken(10), id, respondentName, JSON.stringify(answers), JSON.stringify(reactions), matched ? 1 : 0, new Date().toISOString()).run();
    if (game.view_once && !insert.meta.changes) return NextResponse.json({ error: "Alguien ya respondió a esta invitación de una sola vez." }, { status: 409 });
    const metricStatements = await Promise.all(questions.map(async (question, index) => db.prepare(`INSERT INTO question_metrics (question_hash, locale, level, library_version, selected_count, completed_count, total_answer_chars, last_completed_at) VALUES (?, ?, ?, ?, 1, 1, ?, ?) ON CONFLICT(question_hash, locale, level, library_version) DO UPDATE SET completed_count = completed_count + 1, total_answer_chars = total_answer_chars + excluded.total_answer_chars, last_completed_at = excluded.last_completed_at`).bind(await hashQuestion(question), game.locale, game.level, game.library_version, answers[index].length, new Date().toISOString())));
    if (metricStatements.length) await db.batch(metricStatements);
    const country = String((request as Request & { cf?: { country?: string } }).cf?.country || request.headers.get("cf-ipcountry") || "XX").slice(0, 2).toUpperCase();
    const trendStatements = await Promise.all(questions.map(async (question, index) => db.prepare(`INSERT INTO trend_metrics (question_hash, country, locale, level, completed_count, total_answer_chars, last_completed_at) VALUES (?, ?, ?, ?, 1, ?, ?) ON CONFLICT(question_hash, country, locale, level) DO UPDATE SET completed_count = completed_count + 1, total_answer_chars = total_answer_chars + excluded.total_answer_chars, last_completed_at = excluded.last_completed_at`).bind(await hashQuestion(question), country, game.locale, game.level, answers[index].length, new Date().toISOString())));
    if (trendStatements.length) await db.batch(trendStatements);
    const eventBase = { gameId:id, locale:game.locale, level:game.level, country, libraryVersion:game.library_version };
    await recordEvent({ ...eventBase, eventType:"responded" });
    if (matched) await recordEvent({ ...eventBase, eventType:"matched" });
    return NextResponse.json({ ok: true, matched }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("create-response", error); return NextResponse.json({ error: "No se pudieron enviar las respuestas." }, { status: 500 }); }
}

export async function GET(request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const key = bearerToken(request);
    const db = getDatabase();
    const game = await db.prepare(`SELECT * FROM games WHERE id = ?`).bind(id).first<Record<string, string | number>>();
    if (!game || String(game.creator_token_hash) !== await hashToken(key)) return NextResponse.json({ error: "Este enlace privado no es válido." }, { status: 403 });
    const rows = await db.prepare(`SELECT id, respondent_name, answers_json, reactions_json, matched, created_at FROM responses WHERE game_id = ? ORDER BY created_at DESC`).bind(id).all<{ id: string; respondent_name: string; answers_json: string; reactions_json: string; matched: number; created_at: string }>();
    const base = { game: { id, creatorName: game.creator_name, recipientName: game.recipient_name, title: game.title, level: game.level, locale: game.locale, libraryVersion: game.library_version, questions: JSON.parse(String(game.questions_json)), premium: Boolean(game.premium), viewOnce: Boolean(game.view_once), doubleBlind: Boolean(game.double_blind), packSlug: game.pack_slug, openedAt: game.opened_at, createdAt: game.created_at, expiresAt: game.expires_at, responseCount: rows.results.length } };
    if (game.view_once) return NextResponse.json({ ...base, sealed: rows.results.length > 0, responses: [] }, { headers: { "cache-control": "no-store" } });
    return NextResponse.json({ ...base, sealed: false, responses: rows.results.map((row) => ({ id: row.id, respondentName: row.respondent_name, answers: JSON.parse(row.answers_json), reactions: JSON.parse(row.reactions_json), matched: Boolean(row.matched), createdAt: row.created_at })) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("get-responses", error); return NextResponse.json({ error: "No se pudo abrir el panel." }, { status: 500 }); }
}
