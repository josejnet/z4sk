import { NextResponse } from "next/server";
import { QUESTION_BANK } from "../../lib/questions";
import type { Locale } from "../../lib/i18n";
import type { Level } from "../../lib/types";
import { ensureSchema, getDatabase, hashQuestion } from "../../../db/runtime";

const locales = new Set(["en", "es", "it", "fr", "de"]);
const levels = new Set(["curioso", "coqueto", "picante", "sinfiltro"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const locale = (locales.has(url.searchParams.get("locale") || "") ? url.searchParams.get("locale") : "en") as Locale;
    const level = (levels.has(url.searchParams.get("level") || "") ? url.searchParams.get("level") : "coqueto") as Level;
    const version = "2026.08";
    await ensureSchema();
    const db = getDatabase();
    const candidates = QUESTION_BANK[locale][level];
    const hashes = await Promise.all(candidates.map(hashQuestion));
    const placeholders = hashes.map(() => "?").join(",");
    const rows = await db.prepare(`SELECT question_hash, selected_count, completed_count, total_answer_chars FROM question_metrics WHERE locale = ? AND level = ? AND library_version = ? AND question_hash IN (${placeholders})`).bind(locale, level, version, ...hashes).all<{ question_hash: string; selected_count: number; completed_count: number; total_answer_chars: number }>();
    const metrics = new Map(rows.results.map((row) => [row.question_hash, row]));
    const ranked = candidates.map((question, index) => { const metric = metrics.get(hashes[index]); const selected = metric?.selected_count || 0; const completed = metric?.completed_count || 0; const completionRate = (completed + 3) / (selected + 4); const depth = completed ? Math.min((metric?.total_answer_chars || 0) / completed / 120, 1) : .5; return { question, score: completionRate * .8 + depth * .2 - index * .0001 }; }).sort((a, b) => b.score - a.score).slice(0, 6).map((item) => item.question);
    return NextResponse.json({ questions: ranked, locale, level, libraryVersion: version, privacy: "aggregate-only" }, { headers: { "cache-control": "public, max-age=300" } });
  } catch (error) { console.error("smart-mix", error); return NextResponse.json({ error: "Smart Mix is unavailable." }, { status: 500 }); }
}
