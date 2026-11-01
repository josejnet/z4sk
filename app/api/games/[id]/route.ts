import { NextResponse } from "next/server";
import { bearerToken, deleteGameData, ensureSchema, getDatabase, getRequestCountry, hashToken, recordEvent } from "../../../../db/runtime";

type Context = { params: Promise<{ id: string }> };
type GameRow = { id: string; creator_name: string; recipient_name: string; title: string; level: string; locale: string; library_version: string; questions_json: string; encryption_public_key: string; encrypted_invitation: string; question_count: number; premium: number; view_once: number; double_blind: number; match_question: string; timed_mode: number; pack_slug: string; opened_at: string | null; closed: number; created_at: string; expires_at: string; creator_token_hash: string };

export async function GET(_request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const db = getDatabase();
    const game = await db.prepare(`SELECT * FROM games WHERE id = ?`).bind(id).first<GameRow>();
    if (!game) return NextResponse.json({ error: "Este cuestionario ya no está disponible." }, { status: 404 });
    if (new Date(game.expires_at) <= new Date()) { await deleteGameData(db, id); return NextResponse.json({ error: "Este cuestionario ya no está disponible." }, { status: 410 }); }
    if (game.closed) return NextResponse.json({ error: "Este cuestionario ya no está disponible." }, { status: 404 });
    const count = await db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id = ?`).bind(id).first<{ count: number }>();
    if (game.view_once && Number(count?.count || 0) > 0) return NextResponse.json({ error: "Esta invitación era de una sola respuesta y ya ha sido contestada." }, { status: 410 });
    if (!game.opened_at) { const openedAt = new Date().toISOString(); const updated = await db.prepare(`UPDATE games SET opened_at = ? WHERE id = ? AND opened_at IS NULL`).bind(openedAt, id).run(); if (updated.meta.changes) { const country = getRequestCountry(_request); await recordEvent({ eventType:"opened", gameId:id, locale:game.locale, level:game.level, country, packSlug:game.pack_slug, libraryVersion:game.library_version }); } }
    if (game.encrypted_invitation) return NextResponse.json({ id: game.id, encryptedInvitation: JSON.parse(game.encrypted_invitation), questionCount: game.question_count, premium: Boolean(game.premium), viewOnce: Boolean(game.view_once), openedAt: game.opened_at || new Date().toISOString(), createdAt: game.created_at, expiresAt: game.expires_at }, { headers: { "cache-control": "no-store" } });
    return NextResponse.json({ id: game.id, creatorName: game.creator_name, recipientName: game.recipient_name, title: game.title, level: game.level, locale: game.locale, libraryVersion: game.library_version, questions: JSON.parse(game.questions_json), encryptionPublicKey: JSON.parse(game.encryption_public_key), premium: Boolean(game.premium), viewOnce: Boolean(game.view_once), doubleBlind: Boolean(game.double_blind), matchQuestion: game.match_question, timedMode: Boolean(game.timed_mode), packSlug: game.pack_slug, openedAt: game.opened_at || new Date().toISOString(), createdAt: game.created_at, expiresAt: game.expires_at }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("get-game", error); return NextResponse.json({ error: "No se pudo abrir el cuestionario." }, { status: 500 }); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const key = bearerToken(request);
    const hash = await hashToken(key);
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, locale, level, pack_slug, library_version FROM games WHERE id = ?`).bind(id).first<{ creator_token_hash:string; locale:string; level:string; pack_slug:string; library_version:string }>();
    if (!game || game.creator_token_hash !== hash) return NextResponse.json({ error: "Enlace privado no válido." }, { status: 403 });
    await deleteGameData(db, id);
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("delete-game", error); return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 }); }
}
