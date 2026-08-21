import { NextResponse } from "next/server";
import { bearerToken, deleteGameData, ensureSchema, getDatabase, hashToken, recordEvent } from "../../../../../db/runtime";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    await ensureSchema();
    const { id } = await context.params;
    const key = bearerToken(request);
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, questions_json, view_once, locale, level, pack_slug, library_version FROM games WHERE id = ?`).bind(id).first<{ creator_token_hash:string; questions_json:string; view_once:number; locale:string; level:string; pack_slug:string; library_version:string }>();
    if (!game || game.creator_token_hash !== await hashToken(key)) return NextResponse.json({ error: "Este enlace privado no es válido." }, { status: 403 });
    if (!game.view_once) return NextResponse.json({ error: "Este cuestionario no es efímero." }, { status: 400 });
    const response = await db.prepare(`SELECT id, respondent_name, answers_json, reactions_json, matched, created_at FROM responses WHERE game_id = ? ORDER BY created_at ASC LIMIT 1`).bind(id).first<{ id: string; respondent_name: string; answers_json: string; reactions_json: string; matched: number; created_at: string }>();
    if (!response) return NextResponse.json({ error: "Todavía no hay ninguna respuesta." }, { status: 404 });
    const payload = { questions: JSON.parse(game.questions_json), response: { id: response.id, respondentName: response.respondent_name, answers: JSON.parse(response.answers_json), reactions: JSON.parse(response.reactions_json), matched: Boolean(response.matched), createdAt: response.created_at } };
    await recordEvent({ eventType:"destroyed", gameId:id, locale:game.locale, level:game.level, packSlug:game.pack_slug, libraryVersion:game.library_version });
    await deleteGameData(db, id);
    return NextResponse.json(payload, { headers: { "cache-control": "no-store, no-cache, must-revalidate", pragma: "no-cache" } });
  } catch (error) { console.error("consume-response", error); return NextResponse.json({ error: "No se pudo abrir la respuesta." }, { status: 500 }); }
}
