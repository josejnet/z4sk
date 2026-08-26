import { NextResponse } from "next/server";
import { ensureSchema, getDatabase } from "../../../../db/runtime";
import { authorizeFounder } from "../../../lib/founder-auth";

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const denied = await authorizeFounder(request);
    if (denied) return denied;
    const db=getDatabase();
    const results=await db.batch([
      db.prepare(`SELECT event_type AS label, COUNT(*) AS value FROM product_events GROUP BY event_type ORDER BY value DESC`),
      db.prepare(`SELECT locale AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY locale ORDER BY value DESC`),
      db.prepare(`SELECT country AS label, COUNT(*) AS value FROM product_events WHERE event_type='responded' GROUP BY country ORDER BY value DESC LIMIT 10`),
      db.prepare(`SELECT pack_slug AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY pack_slug ORDER BY value DESC`),
      db.prepare(`SELECT source AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY source ORDER BY value DESC`),
      db.prepare(`SELECT library_version AS label, COUNT(*) AS value FROM product_events WHERE event_type='created' GROUP BY library_version ORDER BY value DESC`),
      db.prepare(`SELECT substr(created_at,1,10) AS day, SUM(CASE WHEN event_type='created' THEN 1 ELSE 0 END) AS created, SUM(CASE WHEN event_type='opened' THEN 1 ELSE 0 END) AS opened, SUM(CASE WHEN event_type='responded' THEN 1 ELSE 0 END) AS responded FROM product_events WHERE created_at >= (NOW() - INTERVAL '14 days')::text GROUP BY day ORDER BY day`),
      db.prepare(`SELECT COUNT(*) AS active, SUM(CASE WHEN premium=1 THEN 1 ELSE 0 END) AS ad_free, SUM(CASE WHEN view_once=1 THEN 1 ELSE 0 END) AS view_once, SUM(CASE WHEN double_blind=1 THEN 1 ELSE 0 END) AS double_blind, SUM(CASE WHEN timed_mode=1 THEN 1 ELSE 0 END) AS timed_mode FROM games WHERE closed=0 AND expires_at > ?`).bind(new Date().toISOString()),
      db.prepare(`SELECT locale||':'||level AS label, SUM(completed_count) AS value FROM question_metrics GROUP BY locale,level ORDER BY value DESC`),
      db.prepare(`SELECT last_run_at, last_source, last_expired_games, last_deleted_responses, total_expired_games, total_deleted_responses FROM privacy_status WHERE id='retention'`),
      db.prepare(`SELECT COUNT(*) AS active_responses FROM responses`),
      db.prepare(`SELECT event_type AS label, COUNT(*) AS value FROM product_events WHERE created_at >= (NOW() - INTERVAL '24 hours')::text GROUP BY event_type ORDER BY value DESC`),
      db.prepare(`SELECT enabled, label, headline, cta_label, destination_url, updated_at FROM sponsor_config WHERE id='primary'`),
      db.prepare(`SELECT event_type AS label, SUM(event_count) AS value FROM sponsor_events WHERE campaign_version=(SELECT updated_at FROM sponsor_config WHERE id='primary') GROUP BY event_type ORDER BY value DESC`),
      db.prepare(`SELECT placement AS label, SUM(CASE WHEN event_type='impression' THEN event_count ELSE 0 END) AS impressions, SUM(CASE WHEN event_type='click' THEN event_count ELSE 0 END) AS clicks FROM sponsor_events WHERE campaign_version=(SELECT updated_at FROM sponsor_config WHERE id='primary') GROUP BY placement ORDER BY impressions DESC`),
      db.prepare(`SELECT locale AS label, SUM(CASE WHEN event_type='impression' THEN event_count ELSE 0 END) AS impressions, SUM(CASE WHEN event_type='click' THEN event_count ELSE 0 END) AS clicks FROM sponsor_events WHERE campaign_version=(SELECT updated_at FROM sponsor_config WHERE id='primary') GROUP BY locale ORDER BY impressions DESC`),
      db.prepare(`SELECT day, SUM(CASE WHEN event_type='impression' THEN event_count ELSE 0 END) AS impressions, SUM(CASE WHEN event_type='click' THEN event_count ELSE 0 END) AS clicks FROM sponsor_events WHERE campaign_version=(SELECT updated_at FROM sponsor_config WHERE id='primary') AND day >= to_char(CURRENT_DATE - INTERVAL '13 days','YYYY-MM-DD') GROUP BY day ORDER BY day`),
      db.prepare(`SELECT event_type AS label, SUM(event_count) AS value FROM sponsor_events GROUP BY event_type ORDER BY value DESC`),
      db.prepare(`SELECT campaign_version AS label, SUM(CASE WHEN event_type='impression' THEN event_count ELSE 0 END) AS impressions, SUM(CASE WHEN event_type='click' THEN event_count ELSE 0 END) AS clicks FROM sponsor_events GROUP BY campaign_version ORDER BY campaign_version DESC LIMIT 8`),
    ]);
    const rows=(index:number)=>results[index].results as Record<string,string|number>[];
    const adRow=rows(12)[0]||{};
    const adEvents=rows(13);const adCount=(eventType:string)=>Number(adEvents.find((row)=>row.label===eventType)?.value||0);const adImpressions=adCount("impression");const adClicks=adCount("click");
    const lifetimeEvents=rows(17);const lifetimeCount=(eventType:string)=>Number(lifetimeEvents.find((row)=>row.label===eventType)?.value||0);
    return NextResponse.json({ generatedAt:new Date().toISOString(), events:rows(0), locales:rows(1), countries:rows(2), packs:rows(3), sources:rows(4), libraryVersions:rows(5), daily:rows(6), inventory:{...rows(7)[0],...rows(10)[0]}, questionSegments:rows(8), privacyHealth:rows(9)[0]||{}, last24Hours:rows(11), adConfig:{enabled:Boolean(adRow.enabled),label:String(adRow.label||"Sponsor"),headline:String(adRow.headline||""),ctaLabel:String(adRow.cta_label||""),destinationUrl:String(adRow.destination_url||""),updatedAt:String(adRow.updated_at||"")}, adStats:{impressions:adImpressions,clicks:adClicks,ctr:adImpressions?Math.round(adClicks/adImpressions*1000)/10:0,placements:rows(14),locales:rows(15),daily:rows(16),lifetime:{impressions:lifetimeCount("impression"),clicks:lifetimeCount("click")},campaigns:rows(18)}, privacy:"Aggregate metrics only. Sponsor counters contain no user identifiers. Answer text, names, emails and private links are never included." }, { headers:{"cache-control":"no-store"} });
  } catch(error){console.error("founder-metrics",error);return NextResponse.json({error:"Metrics unavailable."},{status:500})}
}
