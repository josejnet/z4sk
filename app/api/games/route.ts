import { NextResponse } from "next/server";
import { checkRateLimit, ensureSchema, getDatabase, hashQuestion, hashToken, randomToken, recordEvent } from "../../../db/runtime";

const levels = new Set(["curioso", "coqueto", "picante", "sinfiltro"]);
const locales = new Set(["en", "es", "it", "fr", "de"]);
const packs = new Set(["original", "nightlife", "creator"]);

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const creatorName = cleanText(body.creatorName, 40);
    const recipientName = cleanText(body.recipientName, 40);
    const level = cleanText(body.level, 20);
    const locale = locales.has(cleanText(body.locale, 5)) ? cleanText(body.locale, 5) : "en";
    const libraryVersion = cleanText(body.libraryVersion, 20) || "2026.08";
    const doubleBlind = body.doubleBlind === true ? 1 : 0;
    const creatorInterest = doubleBlind && body.creatorInterest === true ? 1 : 0;
    const packSlug = packs.has(cleanText(body.packSlug, 20)) ? cleanText(body.packSlug, 20) : "original";
    const requestedHours = Number(body.expiresInHours);
    const expiresInHours = [12, 24, 48, 72].includes(requestedHours) ? requestedHours : 12;
    const questions = Array.isArray(body.questions) ? body.questions.map((item) => cleanText(item, 180)).filter((item) => item.length >= 5) : [];
    if (creatorName.length < 2 || recipientName.length < 2 || !levels.has(level) || questions.length < 3 || questions.length > 12) return NextResponse.json({ error: "Revisa los nombres y selecciona entre 3 y 12 preguntas." }, { status: 400 });
    if (new Set(questions).size !== questions.length) return NextResponse.json({ error: "No puede haber preguntas repetidas." }, { status: 400 });

    await ensureSchema();
    const rateLimit = await checkRateLimit(request, "create-game", 10, 10);
    if (!rateLimit.allowed) return NextResponse.json({ error: "Too many questionnaires created. Try again shortly." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
    const db = getDatabase();
    const id = randomToken(8);
    const creatorToken = randomToken(24);
    const tokenHash = await hashToken(creatorToken);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresInHours * 60 * 60 * 1000);
    const viewOnce = body.viewOnce === true ? 1 : 0;
    await db.prepare(`INSERT INTO games (id, creator_token_hash, creator_name, recipient_name, title, level, locale, library_version, questions_json, premium, view_once, double_blind, creator_interest, pack_slug, closed, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?)`).bind(id, tokenHash, creatorName, recipientName, `${recipientName} · Pásalo`, level, locale, libraryVersion, JSON.stringify(questions), viewOnce, doubleBlind, creatorInterest, packSlug, createdAt.toISOString(), expiresAt.toISOString()).run();
    const metricStatements = await Promise.all(questions.map(async (question) => db.prepare(`INSERT INTO question_metrics (question_hash, locale, level, library_version, selected_count, completed_count, total_answer_chars) VALUES (?, ?, ?, ?, 1, 0, 0) ON CONFLICT(question_hash, locale, level, library_version) DO UPDATE SET selected_count = selected_count + 1`).bind(await hashQuestion(question), locale, level, libraryVersion)));
    if (metricStatements.length) await db.batch(metricStatements);
    const country = String((request as Request & { cf?: { country?: string } }).cf?.country || request.headers.get("cf-ipcountry") || "XX").slice(0, 2).toUpperCase();
    await recordEvent({ eventType: "created", gameId: id, locale, level, country, packSlug, source: body.source === "sdk" ? "sdk" : "web", libraryVersion });
    const origin = new URL(request.url).origin;
    return NextResponse.json({ id, playUrl: `${origin}/g/${id}`, adminUrl: `${origin}/p/${id}?key=${creatorToken}` }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("create-game", error);
    return NextResponse.json({ error: "No se pudo crear. Inténtalo de nuevo." }, { status: 500 });
  }
}
