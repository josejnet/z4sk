import { NextResponse } from "next/server";
import { bearerToken, deleteGameData, ensureSchema, getDatabase, hashToken, recordEvent } from "../../../../../db/runtime";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const key = bearerToken(request);
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, questions_json, encryption_public_key, view_once, double_blind, match_question, locale, level, pack_slug, library_version FROM games WHERE id = ?`).bind(id).first<{ creator_token_hash: string; questions_json: string; encryption_public_key: string; view_once: number; double_blind: number; match_question: string; locale: string; level: string; pack_slug: string; library_version: string }>();
    if (!game || game.creator_token_hash !== await hashToken(key)) return NextResponse.json({ error: "Este enlace privado no es válido." }, { status: 403 });
    if (!game.view_once) return NextResponse.json({ error: "Este cuestionario no es efímero." }, { status: 400 });
    const response = await db.prepare(`DELETE FROM responses WHERE id = (SELECT id FROM responses WHERE game_id = ? ORDER BY created_at ASC LIMIT 1) RETURNING id, encrypted_payload, created_at`).bind(id).first<{ id: string; encrypted_payload: string; created_at: string }>();
    if (!response) return NextResponse.json({ error: "Todavía no hay ninguna respuesta." }, { status: 404 });
    const payload = { questions: JSON.parse(game.questions_json), encryptionPublicKey: JSON.parse(game.encryption_public_key), doubleBlind: Boolean(game.double_blind), matchQuestion: game.match_question, response: { id: response.id, encryptedPayload: JSON.parse(response.encrypted_payload), createdAt: response.created_at } };
    await recordEvent({ eventType: "destroyed", gameId: id, locale: game.locale, level: game.level, packSlug: game.pack_slug, libraryVersion: game.library_version });
    await deleteGameData(db, id);
    return NextResponse.json(payload, { headers: { "cache-control": "no-store, no-cache, must-revalidate", pragma: "no-cache" } });
  } catch (error) {
    console.error("consume-response", error);
    return NextResponse.json({ error: "No se pudo abrir la respuesta." }, { status: 500 });
  }
}
