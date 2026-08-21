import { NextResponse } from "next/server";
import { ensureSchema, getDatabase, hashToken, recordEvent } from "../../../../../db/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema();
    const { id } = await params;
    const key = new URL(request.url).searchParams.get("key") || "";
    const db = getDatabase();
    const game = await db.prepare(`SELECT creator_token_hash, locale, level, pack_slug, library_version FROM games WHERE id = ?`).bind(id).first<{ creator_token_hash: string; locale:string; level:string; pack_slug:string; library_version:string }>();
    if (!game || game.creator_token_hash !== await hashToken(key)) return NextResponse.json({ error: "Invalid private link." }, { status: 403 });
    await db.prepare(`UPDATE games SET premium = 1 WHERE id = ?`).bind(id).run();
    await recordEvent({ eventType:"unlocked", gameId:id, locale:game.locale, level:game.level, packSlug:game.pack_slug, libraryVersion:game.library_version });
    return NextResponse.json({ ok: true, premium: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("unlock-game", error); return NextResponse.json({ error: "Could not unlock." }, { status: 500 }); }
}
