import { neon, type FullQueryResults, type NeonQueryFunction } from "@neondatabase/serverless";
import { hashMetricIdentifier, hashRateLimitIdentifier } from "./privacy";

export { deleteGameData, hashMetricIdentifier, hashRateLimitIdentifier, hashToken, purgeExpiredData } from "./privacy";

let client: NeonQueryFunction<false, true> | null = null;

export type DatabaseResult<T = Record<string, unknown>> = {
  results: T[];
  success: true;
  meta: { changes: number };
};

export class PreparedStatement {
  constructor(readonly sql: string, readonly args: unknown[] = []) {}

  bind(...args: unknown[]) {
    return new PreparedStatement(this.sql, args);
  }

  private async execute() {
    return getClient().query(numberPlaceholders(this.sql), this.args, { fullResults: true });
  }

  async run<T = Record<string, unknown>>() {
    return toDatabaseResult<T>(await this.execute());
  }

  async all<T = Record<string, unknown>>() {
    return toDatabaseResult<T>(await this.execute());
  }

  async first<T = Record<string, unknown>>() {
    const result = await this.execute();
    return (result.rows[0] as T | undefined) ?? null;
  }
}

export type Database = {
  prepare(sql: string): PreparedStatement;
  batch<T = Record<string, unknown>>(statements: PreparedStatement[]): Promise<DatabaseResult<T>[]>;
};

function getClient() {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");
  client = neon<false, true>(url, { fullResults: true });
  return client;
}

function numberPlaceholders(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function toDatabaseResult<T>(result: FullQueryResults<false>): DatabaseResult<T> {
  return { results: result.rows as unknown as T[], success: true, meta: { changes: result.rowCount } };
}

const database: Database = {
  prepare(sql) {
    return new PreparedStatement(sql);
  },
  async batch<T>(statements: PreparedStatement[]) {
    const results = await getClient().transaction(
      (tx) => statements.map((statement) => tx.query(numberPlaceholders(statement.sql), statement.args)),
      { fullResults: true },
    );
    return results.map((result) => toDatabaseResult<T>(result));
  },
};

export function getDatabase(): Database {
  return database;
}

export async function ensureSchema() {
  // Schema changes are applied by scripts/migrate.mjs before deployment.
  // Keep this compatibility shim while route modules are migrated gradually.
}

export async function hashQuestion(question: string) {
  return hashMetricIdentifier(`question:${question}`);
}

export function randomToken(bytes = 18) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return [...data].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return "";
}

export async function recordEvent(input: { eventType: string; gameId: string; locale?: string; level?: string; country?: string; packSlug?: string; source?: string; libraryVersion?: string }) {
  const db = getDatabase();
  const pseudonymousGameId = input.gameId ? await hashMetricIdentifier(`event:${input.gameId}`) : "";
  await db.prepare(`INSERT INTO product_events (id, event_type, game_id, locale, level, country, pack_slug, source, library_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(randomToken(10), input.eventType, pseudonymousGameId, input.locale || "en", input.level || "unknown", input.country || "XX", input.packSlug || "original", input.source || "web", input.libraryVersion || "2026.08", new Date().toISOString()).run();
}

export async function checkRateLimit(request: Request, scope: string, maximum: number, windowMinutes = 10) {
  const ip = getRequestIp(request);
  const now = new Date(); const identifierHash = await hashRateLimitIdentifier(`${scope}:${ip.trim()}`, now); const windowMs = windowMinutes * 60_000; const windowStart = Math.floor(now.getTime() / windowMs) * windowMs; const db = getDatabase();
  await db.prepare(`INSERT INTO rate_limits (identifier_hash, scope, window_start, request_count) VALUES (?, ?, ?, 1) ON CONFLICT(identifier_hash, scope, window_start) DO UPDATE SET request_count = rate_limits.request_count + 1`).bind(identifierHash, scope, windowStart).run();
  const row = await db.prepare(`SELECT request_count FROM rate_limits WHERE identifier_hash = ? AND scope = ? AND window_start = ?`).bind(identifierHash, scope, windowStart).first<{ request_count:number }>();
  return { allowed:Number(row?.request_count||0)<=maximum, remaining:Math.max(0,maximum-Number(row?.request_count||0)), retryAfterSeconds:Math.ceil((windowStart+windowMs-Date.now())/1000) };
}

export function getRequestIp(request: Request) {
  return String(request.headers.get("x-forwarded-for")?.split(",")[0] || "local").trim();
}

export function getRequestCountry(request: Request) {
  const country = String(request.headers.get("x-vercel-ip-country") || "XX").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : "XX";
}
