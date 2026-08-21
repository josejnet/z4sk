export async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function deleteGameData(db: D1Database, id: string) {
  const pseudonymousGameId = await hashToken(`event:${id}`);
  return db.batch([
    db.prepare(`DELETE FROM responses WHERE game_id = ?`).bind(id),
    db.prepare(`DELETE FROM abuse_reports WHERE game_id = ?`).bind(id),
    db.prepare(`UPDATE product_events SET game_id = '' WHERE game_id IN (?, ?)`).bind(id, pseudonymousGameId),
    db.prepare(`DELETE FROM games WHERE id = ?`).bind(id),
  ]);
}

export async function purgeExpiredData(db: D1Database, source = "cron", now = new Date()) {
  const runAt = now.toISOString();
  let expiredGames = 0;
  let deletedResponses = 0;

  for (let batch = 0; batch < 20; batch += 1) {
    const expired = await db.prepare(`SELECT id FROM games WHERE expires_at <= ? LIMIT 100`).bind(runAt).all<{ id: string }>();
    if (!expired.results.length) break;
    const ids = expired.results.map((row) => row.id);
    const placeholders = ids.map(() => "?").join(",");
    const responseCount = await db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id IN (${placeholders})`).bind(...ids).first<{ count: number }>();
    const eventIds = await Promise.all(ids.map((id) => hashToken(`event:${id}`)));
    const eventPlaceholders = [...ids, ...eventIds].map(() => "?").join(",");
    await db.batch([
      db.prepare(`DELETE FROM responses WHERE game_id IN (${placeholders})`).bind(...ids),
      db.prepare(`DELETE FROM abuse_reports WHERE game_id IN (${placeholders})`).bind(...ids),
      db.prepare(`UPDATE product_events SET game_id = '' WHERE game_id IN (${eventPlaceholders})`).bind(...ids, ...eventIds),
      db.prepare(`DELETE FROM games WHERE id IN (${placeholders})`).bind(...ids),
    ]);
    expiredGames += ids.length;
    deletedResponses += Number(responseCount?.count || 0);
  }

  const staleRateLimitBefore = now.getTime() - 24 * 60 * 60 * 1000;
  await db.batch([
    db.prepare(`DELETE FROM rate_limits WHERE window_start < ?`).bind(staleRateLimitBefore),
    db.prepare(`INSERT INTO privacy_status (id, last_run_at, last_source, last_expired_games, last_deleted_responses, total_expired_games, total_deleted_responses) VALUES ('retention', ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_run_at = excluded.last_run_at, last_source = excluded.last_source, last_expired_games = excluded.last_expired_games, last_deleted_responses = excluded.last_deleted_responses, total_expired_games = total_expired_games + excluded.total_expired_games, total_deleted_responses = total_deleted_responses + excluded.total_deleted_responses`).bind(runAt, source.slice(0, 20), expiredGames, deletedResponses, expiredGames, deletedResponses),
  ]);

  return { runAt, expiredGames, deletedResponses };
}
