import { NextResponse } from "next/server";
import { bearerToken, deleteGameData, ensureSchema, getDatabase, hashMetricIdentifier, hashToken } from "../../../../../db/runtime";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const key = bearerToken(request);
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, encrypted_invitation, question_count, questions_json, encryption_public_key, view_once, closed, expires_at FROM games WHERE id = ?`).bind(id).first<{ creator_token_hash: string; encrypted_invitation: string; question_count: number; questions_json: string; encryption_public_key: string; view_once: number; closed: number; expires_at: string }>();
    if (!game || game.creator_token_hash !== await hashToken(key)) return NextResponse.json({ error: "Este enlace privado no es válido." }, { status: 403 });
    if (new Date(game.expires_at) <= new Date()) { await deleteGameData(db, id); return NextResponse.json({ error: "Esta invitación ha caducado y sus datos activos se han eliminado." }, { status: 410 }); }
    if (game.closed) return NextResponse.json({ error: "Esta invitación está cerrada." }, { status: 410 });
    if (!game.view_once) return NextResponse.json({ error: "Este cuestionario no es efímero." }, { status: 400 });
    const creatorTokenHash = await hashToken(key);
    const [pseudonymousGameId, legacyPseudonymousGameId] = await Promise.all([hashMetricIdentifier(`event:${id}`), hashToken(`event:${id}`)]);
    const consumed = await db.prepare(`WITH eligible_game AS MATERIALIZED (SELECT id, encrypted_invitation, question_count, questions_json, encryption_public_key FROM games WHERE id = ? AND creator_token_hash = ? AND view_once = 1 AND closed = 0 AND expires_at > ? FOR UPDATE), selected_response AS MATERIALIZED (SELECT response.id, response.encrypted_payload, response.created_at FROM responses AS response JOIN eligible_game AS game ON game.id = response.game_id ORDER BY response.created_at, response.id LIMIT 1 FOR UPDATE OF response), scrubbed_events AS (UPDATE product_events SET game_id = '' WHERE game_id IN (?, ?, ?) AND EXISTS (SELECT 1 FROM selected_response)), deleted_reports AS (DELETE FROM abuse_reports WHERE game_id = ? AND EXISTS (SELECT 1 FROM selected_response)), deleted_game AS (DELETE FROM games WHERE id = (SELECT id FROM eligible_game) AND EXISTS (SELECT 1 FROM selected_response) RETURNING id) SELECT game.encrypted_invitation, game.question_count, game.questions_json, game.encryption_public_key, response.id, response.encrypted_payload, response.created_at FROM eligible_game AS game CROSS JOIN selected_response AS response CROSS JOIN deleted_game`).bind(id, creatorTokenHash, new Date().toISOString(), id, pseudonymousGameId, legacyPseudonymousGameId, id).first<{ encrypted_invitation: string; question_count: number; questions_json: string; encryption_public_key: string; id: string; encrypted_payload: string; created_at: string }>();
    if (!consumed) return NextResponse.json({ error: "Todavía no hay ninguna respuesta." }, { status: 404 });
    const responsePayload = { id: consumed.id, encryptedPayload: JSON.parse(consumed.encrypted_payload), createdAt: consumed.created_at };
    const payload = consumed.encrypted_invitation
      ? { encryptedInvitation: JSON.parse(consumed.encrypted_invitation), questionCount: consumed.question_count, response: responsePayload }
      : { questions: JSON.parse(consumed.questions_json), encryptionPublicKey: JSON.parse(consumed.encryption_public_key), response: responsePayload };
    return NextResponse.json(payload, { headers: { "cache-control": "no-store, no-cache, must-revalidate", pragma: "no-cache" } });
  } catch (error) {
    console.error("consume-response", error);
    return NextResponse.json({ error: "No se pudo abrir la respuesta." }, { status: 500 });
  }
}
