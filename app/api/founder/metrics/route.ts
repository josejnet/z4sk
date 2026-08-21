import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { ensureSchema, getDatabase, hashToken } from "../../../../db/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const configured = (env as unknown as Record<string,string>).FOUNDER_DASHBOARD_KEY; const expected = configured || (url.hostname === "localhost" ? "dev-founder" : ""); const authorization = request.headers.get("authorization") || ""; const supplied = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
    if (!expected) return NextResponse.json({ error:"Set FOUNDER_DASHBOARD_KEY to enable this dashboard." }, { status:503 });
    if (await hashToken(supplied) !== await hashToken(expected)) return NextResponse.json({ error:"Invalid founder key." }, { status:403 });
    await ensureSchema(); const db=getDatabase();
    const results=await db.batch([
      db.prepare(`SELECT event_type AS label, COUNT(*) AS value FROM product_events GROUP BY event_type ORDER BY value DESC`),
      db.prepare(`SELECT locale AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY locale ORDER BY value DESC`),
      db.prepare(`SELECT country AS label, COUNT(*) AS value FROM product_events WHERE event_type='responded' GROUP BY country ORDER BY value DESC LIMIT 10`),
      db.prepare(`SELECT pack_slug AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY pack_slug ORDER BY value DESC`),
      db.prepare(`SELECT source AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY source ORDER BY value DESC`),
      db.prepare(`SELECT library_version AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY library_version ORDER BY value DESC`),
      db.prepare(`SELECT substr(created_at,1,10) AS day, SUM(CASE WHEN event_type='created' THEN 1 ELSE 0 END) AS created, SUM(CASE WHEN event_type='opened' THEN 1 ELSE 0 END) AS opened, SUM(CASE WHEN event_type='responded' THEN 1 ELSE 0 END) AS responded, SUM(CASE WHEN event_type='matched' THEN 1 ELSE 0 END) AS matched FROM product_events WHERE created_at >= datetime('now','-14 days') GROUP BY day ORDER BY day`),
      db.prepare(`SELECT COUNT(*) AS active, SUM(CASE WHEN premium=1 THEN 1 ELSE 0 END) AS ad_free, SUM(CASE WHEN view_once=1 THEN 1 ELSE 0 END) AS view_once, SUM(CASE WHEN double_blind=1 THEN 1 ELSE 0 END) AS double_blind FROM games WHERE closed=0 AND expires_at > ?`).bind(new Date().toISOString()),
      db.prepare(`SELECT locale||':'||level AS label, SUM(completed_count) AS value, ROUND(AVG(CASE WHEN completed_count>0 THEN total_answer_chars*1.0/completed_count ELSE 0 END)) AS avg_depth FROM question_metrics GROUP BY locale,level ORDER BY value DESC`),
      db.prepare(`SELECT last_run_at, last_source, last_expired_games, last_deleted_responses, total_expired_games, total_deleted_responses FROM privacy_status WHERE id='retention'`),
      db.prepare(`SELECT COUNT(*) AS active_responses, SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) AS active_matches FROM responses`),
      db.prepare(`SELECT event_type AS label, COUNT(*) AS value FROM product_events WHERE created_at >= datetime('now','-24 hours') GROUP BY event_type ORDER BY value DESC`),
    ]);
    const rows=(index:number)=>results[index].results as Record<string,string|number>[];
    return NextResponse.json({ generatedAt:new Date().toISOString(), events:rows(0), locales:rows(1), countries:rows(2), packs:rows(3), sources:rows(4), libraryVersions:rows(5), daily:rows(6), inventory:{...rows(7)[0],...rows(10)[0]}, questionSegments:rows(8), privacyHealth:rows(9)[0]||{}, last24Hours:rows(11), privacy:"Aggregate metrics only. Answer text, names, emails and private links are never included." }, { headers:{"cache-control":"no-store"} });
  } catch(error){console.error("founder-metrics",error);return NextResponse.json({error:"Metrics unavailable."},{status:500})}
}
