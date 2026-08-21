import { NextResponse } from "next/server";
import { QUESTION_BANK } from "../../lib/questions";
import type { Locale } from "../../lib/i18n";
import type { Level } from "../../lib/types";
import { ensureSchema, getDatabase, hashQuestion } from "../../../db/runtime";

const locales = new Set(["en", "es", "it", "fr", "de"]);
export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const locale = (locales.has(url.searchParams.get("locale") || "") ? url.searchParams.get("locale") : "en") as Locale; const country = (url.searchParams.get("country") || "US").slice(0, 2).toUpperCase();
    await ensureSchema(); const db = getDatabase();
    const catalog = (Object.keys(QUESTION_BANK[locale]) as Level[]).flatMap((level) => QUESTION_BANK[locale][level].map((question) => ({ level, question })));
    const hashes = await Promise.all(catalog.map((item) => hashQuestion(item.question))); const placeholders = hashes.map(() => "?").join(",");
    const rows = await db.prepare(`SELECT question_hash, level, completed_count, total_answer_chars FROM trend_metrics WHERE country = ? AND locale = ? AND completed_count >= 5 AND question_hash IN (${placeholders}) ORDER BY completed_count DESC LIMIT 10`).bind(country, locale, ...hashes).all<{ question_hash:string; level:string; completed_count:number; total_answer_chars:number }>();
    const byHash = new Map(hashes.map((hash, index) => [hash, catalog[index]]));
    return NextResponse.json({ country, locale, privacyThreshold: 5, trends: rows.results.map((row, index) => ({ rank:index+1, question:byHash.get(row.question_hash)?.question, level:row.level, completions:row.completed_count, averageAnswerLength:Math.round(row.total_answer_chars/row.completed_count) })) }, { headers:{"cache-control":"public, max-age=3600"} });
  } catch (error) { console.error("trends", error); return NextResponse.json({ error:"Trends unavailable." }, { status:500 }); }
}
