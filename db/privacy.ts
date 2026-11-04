export async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashRateLimitIdentifier(identifier: string, at = new Date()) {
  const rotationBucket = at.toISOString().slice(0, 10);
  return keyedHash(`rate-limit:${rotationBucket}:${identifier}`);
}

export async function hashMetricIdentifier(identifier: string) {
  return keyedHash(`metric:${identifier}`);
}

async function keyedHash(value: string) {
  const configuredSecret = process.env.RATE_LIMIT_HMAC_SECRET;
  if (!configuredSecret && process.env.NODE_ENV === "production") throw new Error("RATE_LIMIT_HMAC_SECRET is required in production.");
  const secret = configuredSecret || "z4sk-local-rate-limit-hmac-only";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function deleteGameData(db: Database, id: string) {
  const [pseudonymousGameId, legacyPseudonymousGameId] = await Promise.all([hashMetricIdentifier(`event:${id}`), hashToken(`event:${id}`)]);
  return db.batch([
    db.prepare(`DELETE FROM responses WHERE game_id = ?`).bind(id),
    db.prepare(`DELETE FROM abuse_reports WHERE game_id = ?`).bind(id),
    db.prepare(`UPDATE product_events SET game_id = '' WHERE game_id IN (?, ?, ?)`).bind(id, pseudonymousGameId, legacyPseudonymousGameId),
    db.prepare(`DELETE FROM games WHERE id = ?`).bind(id),
  ]);
}

export async function purgeExpiredData(
  db: Database,
  source = "cron",
  now = new Date(),
  maxGames = Number.POSITIVE_INFINITY,
) {
  const runAt = now.toISOString();
  let expiredGames = 0;
  let deletedResponses = 0;

  while (expiredGames < maxGames) {
    const batchSize = Math.min(250, maxGames - expiredGames);
    const expired = await db.prepare(`SELECT id FROM games WHERE expires_at <= ? LIMIT ${batchSize}`).bind(runAt).all<{ id: string }>();
    if (!expired.results.length) break;
    const ids = expired.results.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    const responseCount = await db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id IN (${placeholders})`).bind(...ids).first<{ count: number }>();
    const [eventIds, legacyEventIds] = await Promise.all([
      Promise.all(ids.map((id) => hashMetricIdentifier(`event:${id}`))),
      Promise.all(ids.map((id) => hashToken(`event:${id}`))),
    ]);
    const eventPlaceholders = [...ids, ...eventIds, ...legacyEventIds].map(() => "?").join(",");
    await db.batch([
      db.prepare(`DELETE FROM responses WHERE game_id IN (${placeholders})`).bind(...ids),
      db.prepare(`DELETE FROM abuse_reports WHERE game_id IN (${placeholders})`).bind(...ids),
      db.prepare(`UPDATE product_events SET game_id = '' WHERE game_id IN (${eventPlaceholders})`).bind(...ids, ...eventIds, ...legacyEventIds),
      db.prepare(`DELETE FROM games WHERE id IN (${placeholders})`).bind(...ids),
    ]);
    expiredGames += ids.length;
    deletedResponses += Number(responseCount?.count || 0);
  }

  const staleRateLimitBefore = now.getTime() - 24 * 60 * 60 * 1000;
  await db.batch([
    db.prepare(`DELETE FROM rate_limits WHERE window_start < ?`).bind(staleRateLimitBefore),
    db.prepare(`INSERT INTO privacy_status (id, last_run_at, last_source, last_expired_games, last_deleted_responses, total_expired_games, total_deleted_responses) VALUES ('retention', ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_run_at = excluded.last_run_at, last_source = excluded.last_source, last_expired_games = excluded.last_expired_games, last_deleted_responses = excluded.last_deleted_responses, total_expired_games = privacy_status.total_expired_games + excluded.total_expired_games, total_deleted_responses = privacy_status.total_deleted_responses + excluded.total_deleted_responses`).bind(runAt, source.slice(0, 20), expiredGames, deletedResponses, expiredGames, deletedResponses),
  ]);

  return { runAt, expiredGames, deletedResponses };
}
import type { Database } from "./runtime";
