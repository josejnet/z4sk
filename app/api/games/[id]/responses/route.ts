import { NextResponse } from "next/server";
import { bearerToken, checkRateLimit, ensureSchema, getDatabase, hashQuestion, hashToken, randomToken, recordEvent } from "../../../../../db/runtime";
import { isEncryptedResponseEnvelope } from "../../../../lib/encryption-types";

type Context = { params: Promise<{ id: string }> };
type GameRow = { creator_token_hash: string; creator_name: string; recipient_name: string; title: string; questions_json: string; encryption_public_key: string; locale: string; level: string; library_version: string; premium: number; view_once: number; double_blind: number; pack_slug: string; opened_at: string | null; created_at: string; closed: number; expires_at: string };

export async function POST(request: Request, context: Context) {
  try {
    await ensureSchema();
    const rateLimit = await checkRateLimit(request, "submit-response", 30, 10);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Too many responses. Try again shortly." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
    const { id } = await context.params;
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, questions_json, locale, level, library_version, view_once, closed, expires_at FROM games WHERE id = ?`).bind(id).first<Pick<GameRow, "creator_token_hash" | "questions_json" | "locale" | "level" | "library_version" | "view_once" | "closed" | "expires_at">>();
    if (!game || game.closed || new Date(game.expires_at) < new Date()) return NextResponse.json({ error: "Este cuestionario ya no está disponible." }, { status: 404 });
    const existing = await db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id = ?`).bind(id).first<{ count: number }>();
    if (game.view_once && Number(existing?.count || 0) > 0) return NextResponse.json({ error: "Alguien ya respondió a esta invitación de una sola vez." }, { status: 409 });
    const body = await request.json() as { encryptedResponse?: unknown; answerCount?: unknown };
    const questions = JSON.parse(game.questions_json) as string[];
    const answerCount = Number(body.answerCount);
    if (answerCount !== questions.length || !isEncryptedResponseEnvelope(body.encryptedResponse)) return NextResponse.json({ error: "La respuesta cifrada no es válida." }, { status: 400 });
    const encryptedPayload = JSON.stringify(body.encryptedResponse);
    const responseId = randomToken(10);
    const createdAt = new Date().toISOString();
    const insert = game.view_once
      ? await db.prepare(`INSERT INTO responses (id, game_id, respondent_name, answers_json, reactions_json, encrypted_payload, matched, created_at) SELECT ?, ?, '', '[]', '[]', ?, 0, ? WHERE NOT EXISTS (SELECT 1 FROM responses WHERE game_id = ?)`).bind(responseId, id, encryptedPayload, createdAt, id).run()
      : await db.prepare(`INSERT INTO responses (id, game_id, respondent_name, answers_json, reactions_json, encrypted_payload, matched, created_at) VALUES (?, ?, '', '[]', '[]', ?, 0, ?)`).bind(responseId, id, encryptedPayload, createdAt).run();
    if (game.view_once && !insert.meta.changes) return NextResponse.json({ error: "Alguien ya respondió a esta invitación de una sola vez." }, { status: 409 });
    const metricStatements = await Promise.all(questions.map(async (question) => db.prepare(`INSERT INTO question_metrics (question_hash, locale, level, library_version, selected_count, completed_count, total_answer_chars, last_completed_at) VALUES (?, ?, ?, ?, 1, 1, 0, ?) ON CONFLICT(question_hash, locale, level, library_version) DO UPDATE SET completed_count = completed_count + 1, last_completed_at = excluded.last_completed_at`).bind(await hashQuestion(question), game.locale, game.level, game.library_version, createdAt)));
    if (metricStatements.length) await db.batch(metricStatements);
    const country = String((request as Request & { cf?: { country?: string } }).cf?.country || request.headers.get("cf-ipcountry") || "XX").slice(0, 2).toUpperCase();
    const trendStatements = await Promise.all(questions.map(async (question) => db.prepare(`INSERT INTO trend_metrics (question_hash, country, locale, level, completed_count, total_answer_chars, last_completed_at) VALUES (?, ?, ?, ?, 1, 0, ?) ON CONFLICT(question_hash, country, locale, level) DO UPDATE SET completed_count = completed_count + 1, last_completed_at = excluded.last_completed_at`).bind(await hashQuestion(question), country, game.locale, game.level, createdAt)));
    if (trendStatements.length) await db.batch(trendStatements);
    await recordEvent({ eventType: "responded", gameId: id, locale: game.locale, level: game.level, country, libraryVersion: game.library_version });
    return NextResponse.json({ ok: true }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("create-response", error);
    return NextResponse.json({ error: "No se pudieron enviar las respuestas." }, { status: 500 });
  }
}

export async function GET(request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const key = bearerToken(request);
    const db = getDatabase();
    const game = await db.prepare(`SELECT * FROM games WHERE id = ?`).bind(id).first<GameRow>();
    if (!game || game.creator_token_hash !== await hashToken(key)) return NextResponse.json({ error: "Este enlace privado no es válido." }, { status: 403 });
    const rows = await db.prepare(`SELECT id, encrypted_payload, created_at FROM responses WHERE game_id = ? ORDER BY created_at DESC`).bind(id).all<{ id: string; encrypted_payload: string; created_at: string }>();
    const base = { game: { id, creatorName: game.creator_name, recipientName: game.recipient_name, title: game.title, level: game.level, locale: game.locale, libraryVersion: game.library_version, questions: JSON.parse(game.questions_json), encryptionPublicKey: JSON.parse(game.encryption_public_key), premium: Boolean(game.premium), viewOnce: Boolean(game.view_once), doubleBlind: Boolean(game.double_blind), packSlug: game.pack_slug, openedAt: game.opened_at, createdAt: game.created_at, expiresAt: game.expires_at, responseCount: rows.results.length } };
    if (game.view_once) return NextResponse.json({ ...base, sealed: rows.results.length > 0, responses: [] }, { headers: { "cache-control": "no-store" } });
    return NextResponse.json({ ...base, sealed: false, responses: rows.results.map((row) => ({ id: row.id, encryptedPayload: JSON.parse(row.encrypted_payload), createdAt: row.created_at })) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("get-responses", error);
    return NextResponse.json({ error: "No se pudo abrir el panel." }, { status: 500 });
  }
}
