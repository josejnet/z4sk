import { env } from "cloudflare:workers";
import { hashToken } from "./privacy";

export { deleteGameData, hashToken, purgeExpiredData } from "./privacy";

let schemaReady: Promise<void> | null = null;

export function getDatabase(): D1Database {
  if (!env.DB) throw new Error("La base de datos no está disponible");
  return env.DB;
}

export async function ensureSchema() {
  if (!schemaReady) schemaReady = (async () => {
    const db = getDatabase();
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, creator_token_hash TEXT NOT NULL, creator_email TEXT NOT NULL DEFAULT '', creator_name TEXT NOT NULL, recipient_name TEXT NOT NULL, title TEXT NOT NULL, level TEXT NOT NULL, locale TEXT NOT NULL DEFAULT 'en', library_version TEXT NOT NULL DEFAULT '2026.08', questions_json TEXT NOT NULL, encryption_public_key TEXT NOT NULL DEFAULT '', premium INTEGER NOT NULL DEFAULT 0, view_once INTEGER NOT NULL DEFAULT 0, double_blind INTEGER NOT NULL DEFAULT 0, creator_interest INTEGER NOT NULL DEFAULT 0, pack_slug TEXT NOT NULL DEFAULT 'original', opened_at TEXT, closed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS responses (id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE, respondent_name TEXT NOT NULL, answers_json TEXT NOT NULL, reactions_json TEXT NOT NULL DEFAULT '[]', encrypted_payload TEXT NOT NULL DEFAULT '', matched INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_responses_game_created ON responses(game_id, created_at)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS question_metrics (question_hash TEXT NOT NULL, locale TEXT NOT NULL, level TEXT NOT NULL, library_version TEXT NOT NULL, selected_count INTEGER NOT NULL DEFAULT 0, completed_count INTEGER NOT NULL DEFAULT 0, total_answer_chars INTEGER NOT NULL DEFAULT 0, last_completed_at TEXT, PRIMARY KEY (question_hash, locale, level, library_version))`),
      db.prepare(`CREATE TABLE IF NOT EXISTS trend_metrics (question_hash TEXT NOT NULL, country TEXT NOT NULL, locale TEXT NOT NULL, level TEXT NOT NULL, completed_count INTEGER NOT NULL DEFAULT 0, total_answer_chars INTEGER NOT NULL DEFAULT 0, last_completed_at TEXT NOT NULL, PRIMARY KEY (question_hash, country, locale, level))`),
      db.prepare(`CREATE TABLE IF NOT EXISTS product_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, game_id TEXT NOT NULL, locale TEXT NOT NULL, level TEXT NOT NULL, country TEXT NOT NULL, pack_slug TEXT NOT NULL, source TEXT NOT NULL, library_version TEXT NOT NULL, created_at TEXT NOT NULL)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_events_type_created ON product_events(event_type, created_at)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS abuse_reports (id TEXT PRIMARY KEY, game_id TEXT NOT NULL, reason TEXT NOT NULL, country TEXT NOT NULL, created_at TEXT NOT NULL)`),
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_abuse_reports_game ON abuse_reports(game_id)`),
      db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (identifier_hash TEXT NOT NULL, scope TEXT NOT NULL, window_start INTEGER NOT NULL, request_count INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (identifier_hash, scope, window_start))`),
      db.prepare(`CREATE TABLE IF NOT EXISTS privacy_status (id TEXT PRIMARY KEY, last_run_at TEXT NOT NULL, last_source TEXT NOT NULL, last_expired_games INTEGER NOT NULL DEFAULT 0, last_deleted_responses INTEGER NOT NULL DEFAULT 0, total_expired_games INTEGER NOT NULL DEFAULT 0, total_deleted_responses INTEGER NOT NULL DEFAULT 0)`),
    ]);
    const columns = await db.prepare(`PRAGMA table_info(games)`).all<{ name: string }>();
    if (!columns.results.some((column) => column.name === "view_once")) await db.prepare(`ALTER TABLE games ADD COLUMN view_once INTEGER NOT NULL DEFAULT 0`).run();
    if (!columns.results.some((column) => column.name === "creator_email")) await db.prepare(`ALTER TABLE games ADD COLUMN creator_email TEXT NOT NULL DEFAULT ''`).run();
    await db.prepare(`UPDATE games SET creator_email = '' WHERE creator_email <> ''`).run();
    if (!columns.results.some((column) => column.name === "encryption_public_key")) await db.prepare(`ALTER TABLE games ADD COLUMN encryption_public_key TEXT NOT NULL DEFAULT ''`).run();
    if (!columns.results.some((column) => column.name === "locale")) await db.prepare(`ALTER TABLE games ADD COLUMN locale TEXT NOT NULL DEFAULT 'en'`).run();
    if (!columns.results.some((column) => column.name === "library_version")) await db.prepare(`ALTER TABLE games ADD COLUMN library_version TEXT NOT NULL DEFAULT '2026.08'`).run();
    if (!columns.results.some((column) => column.name === "double_blind")) await db.prepare(`ALTER TABLE games ADD COLUMN double_blind INTEGER NOT NULL DEFAULT 0`).run();
    if (!columns.results.some((column) => column.name === "creator_interest")) await db.prepare(`ALTER TABLE games ADD COLUMN creator_interest INTEGER NOT NULL DEFAULT 0`).run();
    if (!columns.results.some((column) => column.name === "pack_slug")) await db.prepare(`ALTER TABLE games ADD COLUMN pack_slug TEXT NOT NULL DEFAULT 'original'`).run();
    if (!columns.results.some((column) => column.name === "opened_at")) await db.prepare(`ALTER TABLE games ADD COLUMN opened_at TEXT`).run();
    const responseColumns = await db.prepare(`PRAGMA table_info(responses)`).all<{ name: string }>();
    if (!responseColumns.results.some((column) => column.name === "reactions_json")) await db.prepare(`ALTER TABLE responses ADD COLUMN reactions_json TEXT NOT NULL DEFAULT '[]'`).run();
    if (!responseColumns.results.some((column) => column.name === "matched")) await db.prepare(`ALTER TABLE responses ADD COLUMN matched INTEGER NOT NULL DEFAULT 0`).run();
    if (!responseColumns.results.some((column) => column.name === "encrypted_payload")) await db.prepare(`ALTER TABLE responses ADD COLUMN encrypted_payload TEXT NOT NULL DEFAULT ''`).run();
    await db.prepare(`DELETE FROM abuse_reports WHERE game_id IN (SELECT id FROM games WHERE encryption_public_key = '')`).run();
    await db.prepare(`DELETE FROM responses WHERE game_id IN (SELECT id FROM games WHERE encryption_public_key = '') OR encrypted_payload = ''`).run();
    await db.prepare(`DELETE FROM games WHERE encryption_public_key = ''`).run();
    await db.prepare(`UPDATE games SET creator_interest = 0 WHERE creator_interest <> 0`).run();
    await db.prepare(`UPDATE responses SET respondent_name = '', answers_json = '[]', reactions_json = '[]', matched = 0 WHERE encrypted_payload <> '' AND (respondent_name <> '' OR answers_json <> '[]' OR reactions_json <> '[]' OR matched <> 0)`).run();
    await db.prepare(`DELETE FROM product_events WHERE event_type = 'matched'`).run();
  })().catch((error) => { schemaReady = null; throw error; });
  await schemaReady;
}

export const hashQuestion = hashToken;

export function randomToken(bytes = 18) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return [...data].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return new URL(request.url).searchParams.get("key") || "";
}

export async function recordEvent(input: { eventType: string; gameId: string; locale?: string; level?: string; country?: string; packSlug?: string; source?: string; libraryVersion?: string }) {
  const db = getDatabase();
  const pseudonymousGameId = input.gameId ? await hashToken(`event:${input.gameId}`) : "";
  await db.prepare(`INSERT INTO product_events (id, event_type, game_id, locale, level, country, pack_slug, source, library_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(randomToken(10), input.eventType, pseudonymousGameId, input.locale || "en", input.level || "unknown", input.country || "XX", input.packSlug || "original", input.source || "web", input.libraryVersion || "2026.08", new Date().toISOString()).run();
}

export async function checkRateLimit(request: Request, scope: string, maximum: number, windowMinutes = 10) {
  const ip = String((request as Request & { cf?: { connectingIp?: string } }).cf?.connectingIp || request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local");
  const identifierHash = await hashToken(`${scope}:${ip}`); const windowMs = windowMinutes * 60_000; const windowStart = Math.floor(Date.now() / windowMs) * windowMs; const db = getDatabase();
  await db.prepare(`INSERT INTO rate_limits (identifier_hash, scope, window_start, request_count) VALUES (?, ?, ?, 1) ON CONFLICT(identifier_hash, scope, window_start) DO UPDATE SET request_count = request_count + 1`).bind(identifierHash, scope, windowStart).run();
  const row = await db.prepare(`SELECT request_count FROM rate_limits WHERE identifier_hash = ? AND scope = ? AND window_start = ?`).bind(identifierHash, scope, windowStart).first<{ request_count:number }>();
  return { allowed:Number(row?.request_count||0)<=maximum, remaining:Math.max(0,maximum-Number(row?.request_count||0)), retryAfterSeconds:Math.ceil((windowStart+windowMs-Date.now())/1000) };
}
