import { NextResponse } from "next/server";
import { checkRateLimit, deleteGameData, ensureSchema, getDatabase, getRequestCountry, getRequestIp, hashMetricIdentifier, randomToken, recordEvent } from "../../../../../db/runtime";

type Context = { params: Promise<{ id: string }> };
const reasons = new Set(["harassment", "underage", "privacy", "spam", "other"]);

export async function POST(request: Request, context: Context) {
  try {
    await ensureSchema();
    const limit = await checkRateLimit(request, "report-invitation", 5, 60);
    if (!limit.allowed) return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
    const { id } = await context.params;
    const body = await request.json() as { reason?: unknown };
    const reason = typeof body.reason === "string" && reasons.has(body.reason) ? body.reason : "other";
    const db = getDatabase();
    const game = await db.prepare(`SELECT locale, level, pack_slug, library_version, closed, expires_at FROM games WHERE id = ?`).bind(id).first<{ locale:string; level:string; pack_slug:string; library_version:string; closed:number; expires_at:string }>();
    if (!game) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    if (new Date(game.expires_at) <= new Date()) { await deleteGameData(db, id); return NextResponse.json({ error: "Invitation not found." }, { status: 404 }); }
    if (game.closed) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
    const country = getRequestCountry(request);
    const reporterHash = await hashMetricIdentifier(`abuse-reporter:${id}:${getRequestIp(request)}`);
    const inserted = await db.prepare(`INSERT INTO abuse_reports (id, game_id, reason, country, reporter_hash, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`).bind(randomToken(10), id, reason, country, reporterHash, new Date().toISOString()).run();
    const count = await db.prepare(`SELECT COUNT(DISTINCT reporter_hash) AS count FROM abuse_reports WHERE game_id = ? AND reporter_hash <> ''`).bind(id).first<{ count:number }>();
    const automaticallyClosed = Number(count?.count || 0) >= 3;
    if (automaticallyClosed) await db.prepare(`UPDATE games SET closed = 1 WHERE id = ?`).bind(id).run();
    if (inserted.meta.changes) await recordEvent({ eventType:"reported", gameId:id, locale:game.locale, level:game.level, country, packSlug:game.pack_slug, libraryVersion:game.library_version });
    return NextResponse.json({ ok:true, duplicate:!inserted.meta.changes, automaticallyClosed }, { status:inserted.meta.changes ? 201 : 200, headers:{ "cache-control":"no-store" } });
  } catch (error) {
    console.error("report-invitation", error);
    return NextResponse.json({ error:"Could not send the report." }, { status:500 });
  }
}
