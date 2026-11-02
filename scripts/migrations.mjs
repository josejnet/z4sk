import { neon } from "@neondatabase/serverless";

const migrations = [
  {
    id: "2026-11-01-baseline-and-runtime-cleanup",
    statements: [
      `CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, creator_token_hash TEXT NOT NULL, creator_email TEXT NOT NULL DEFAULT '', creator_name TEXT NOT NULL, recipient_name TEXT NOT NULL, title TEXT NOT NULL, level TEXT NOT NULL, locale TEXT NOT NULL DEFAULT 'en', library_version TEXT NOT NULL DEFAULT '2026.08', questions_json TEXT NOT NULL, encryption_public_key TEXT NOT NULL DEFAULT '', premium INTEGER NOT NULL DEFAULT 0, view_once INTEGER NOT NULL DEFAULT 0, double_blind INTEGER NOT NULL DEFAULT 0, match_question TEXT NOT NULL DEFAULT '', timed_mode INTEGER NOT NULL DEFAULT 0, creator_interest INTEGER NOT NULL DEFAULT 0, pack_slug TEXT NOT NULL DEFAULT 'original', opened_at TEXT, closed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS responses (id TEXT PRIMARY KEY, game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE, respondent_name TEXT NOT NULL, answers_json TEXT NOT NULL, reactions_json TEXT NOT NULL DEFAULT '[]', encrypted_payload TEXT NOT NULL DEFAULT '', matched INTEGER NOT NULL DEFAULT 0, single_use INTEGER NOT NULL DEFAULT 0, delete_token_hash TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS idx_responses_game_created ON responses(game_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS question_metrics (question_hash TEXT NOT NULL, locale TEXT NOT NULL, level TEXT NOT NULL, library_version TEXT NOT NULL, selected_count INTEGER NOT NULL DEFAULT 0, completed_count INTEGER NOT NULL DEFAULT 0, total_answer_chars INTEGER NOT NULL DEFAULT 0, last_completed_at TEXT, PRIMARY KEY (question_hash, locale, level, library_version))`,
      `CREATE TABLE IF NOT EXISTS trend_metrics (question_hash TEXT NOT NULL, country TEXT NOT NULL, locale TEXT NOT NULL, level TEXT NOT NULL, completed_count INTEGER NOT NULL DEFAULT 0, total_answer_chars INTEGER NOT NULL DEFAULT 0, last_completed_at TEXT NOT NULL, PRIMARY KEY (question_hash, country, locale, level))`,
      `CREATE TABLE IF NOT EXISTS product_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, game_id TEXT NOT NULL, locale TEXT NOT NULL, level TEXT NOT NULL, country TEXT NOT NULL, pack_slug TEXT NOT NULL, source TEXT NOT NULL, library_version TEXT NOT NULL, created_at TEXT NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS idx_product_events_type_created ON product_events(event_type, created_at)`,
      `CREATE TABLE IF NOT EXISTS abuse_reports (id TEXT PRIMARY KEY, game_id TEXT NOT NULL, reason TEXT NOT NULL, country TEXT NOT NULL, created_at TEXT NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS idx_abuse_reports_game ON abuse_reports(game_id)`,
      `CREATE TABLE IF NOT EXISTS rate_limits (identifier_hash TEXT NOT NULL, scope TEXT NOT NULL, window_start BIGINT NOT NULL, request_count INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (identifier_hash, scope, window_start))`,
      `CREATE TABLE IF NOT EXISTS privacy_status (id TEXT PRIMARY KEY, last_run_at TEXT NOT NULL, last_source TEXT NOT NULL, last_expired_games INTEGER NOT NULL DEFAULT 0, last_deleted_responses INTEGER NOT NULL DEFAULT 0, total_expired_games INTEGER NOT NULL DEFAULT 0, total_deleted_responses INTEGER NOT NULL DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS sponsor_config (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, label TEXT NOT NULL DEFAULT 'Sponsor', headline TEXT NOT NULL DEFAULT '', cta_label TEXT NOT NULL DEFAULT '', destination_url TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS sponsor_events (campaign_version TEXT NOT NULL, day TEXT NOT NULL, event_type TEXT NOT NULL, placement TEXT NOT NULL, locale TEXT NOT NULL, event_count BIGINT NOT NULL DEFAULT 0, PRIMARY KEY (campaign_version, day, event_type, placement, locale))`,
      `INSERT INTO sponsor_config (id, enabled, label, headline, cta_label, destination_url, updated_at) VALUES ('primary', 0, 'Sponsor', '', '', '', CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING`,
      `ALTER TABLE rate_limits ALTER COLUMN window_start TYPE BIGINT`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS view_once INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS creator_email TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS encryption_public_key TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS library_version TEXT NOT NULL DEFAULT '2026.08'`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS double_blind INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS match_question TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS timed_mode INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS creator_interest INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS pack_slug TEXT NOT NULL DEFAULT 'original'`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS opened_at TEXT`,
      `ALTER TABLE responses ADD COLUMN IF NOT EXISTS reactions_json TEXT NOT NULL DEFAULT '[]'`,
      `ALTER TABLE responses ADD COLUMN IF NOT EXISTS matched INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE responses ADD COLUMN IF NOT EXISTS encrypted_payload TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE responses ADD COLUMN IF NOT EXISTS single_use INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE responses ADD COLUMN IF NOT EXISTS delete_token_hash TEXT NOT NULL DEFAULT ''`,
      `UPDATE games SET creator_email = '' WHERE creator_email <> ''`,
      `UPDATE responses AS response SET single_use = 1 FROM games AS game WHERE response.game_id = game.id AND game.view_once = 1 AND response.single_use <> 1`,
      `DELETE FROM responses WHERE id IN (SELECT id FROM (SELECT response.id, ROW_NUMBER() OVER (PARTITION BY response.game_id ORDER BY response.created_at, response.id) AS position FROM responses AS response WHERE response.single_use = 1) AS ranked WHERE ranked.position > 1)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_responses_single_use_game ON responses(game_id) WHERE single_use = 1`,
      `DELETE FROM abuse_reports WHERE game_id IN (SELECT id FROM games WHERE encryption_public_key = '')`,
      `DELETE FROM responses WHERE game_id IN (SELECT id FROM games WHERE encryption_public_key = '') OR encrypted_payload = ''`,
      `DELETE FROM games WHERE encryption_public_key = ''`,
      `UPDATE games SET creator_interest = 0 WHERE creator_interest <> 0`,
      `UPDATE responses SET respondent_name = '', answers_json = '[]', reactions_json = '[]', matched = 0 WHERE encrypted_payload <> '' AND (respondent_name <> '' OR answers_json <> '[]' OR reactions_json <> '[]' OR matched <> 0)`,
      `DELETE FROM product_events WHERE event_type = 'matched'`,
    ],
  },
  {
    id: "2026-11-01-distinct-abuse-reporters",
    statements: [
      `ALTER TABLE abuse_reports ADD COLUMN IF NOT EXISTS reporter_hash TEXT NOT NULL DEFAULT ''`,
      `UPDATE abuse_reports SET reporter_hash = 'legacy:' || id WHERE reporter_hash = ''`,
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_abuse_reports_game_reporter ON abuse_reports(game_id, reporter_hash) WHERE reporter_hash <> ''`,
    ],
  },
  {
    id: "2026-11-01-public-role-hardening",
    statements: [
      `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC`,
      `REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC`,
    ],
  },
  {
    id: "2026-11-01-encrypted-invitation-payloads",
    statements: [
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS encrypted_invitation TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE games ADD COLUMN IF NOT EXISTS question_count INTEGER NOT NULL DEFAULT 0`,
      `UPDATE games SET question_count = jsonb_array_length(questions_json::jsonb) WHERE encrypted_invitation = '' AND question_count = 0 AND jsonb_typeof(questions_json::jsonb) = 'array'`,
    ],
  },
  {
    id: "2026-11-02-privacy-preserving-csp-telemetry",
    statements: [
      `CREATE TABLE IF NOT EXISTS csp_violation_daily (day DATE NOT NULL, directive TEXT NOT NULL, route_group TEXT NOT NULL, disposition TEXT NOT NULL, event_count BIGINT NOT NULL DEFAULT 0, PRIMARY KEY (day, directive, route_group, disposition))`,
      `REVOKE ALL ON csp_violation_daily FROM PUBLIC`,
    ],
  },
  {
    id: "2026-11-02-remove-expired-and-pre-v2-invitations",
    statements: [
      `DELETE FROM games WHERE expires_at::timestamptz <= CURRENT_TIMESTAMP OR encrypted_invitation = '' OR encrypted_invitation::jsonb->>'v' IS DISTINCT FROM '2' OR encrypted_invitation::jsonb->>'alg' IS DISTINCT FROM 'HKDF-SHA256+A256GCM+A256GCM' OR encrypted_invitation::jsonb->>'salt' IS NULL OR encrypted_invitation::jsonb->>'keyIv' IS NULL OR encrypted_invitation::jsonb->>'wrappedKey' IS NULL OR encrypted_invitation::jsonb->>'iv' IS NULL OR encrypted_invitation::jsonb->>'ciphertext' IS NULL`,
    ],
  },
];

export async function runMigrations(databaseUrl) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required to run migrations.");
  const sql = neon(databaseUrl, { fullResults: true });
  await sql.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const appliedResult = await sql.query(`SELECT id FROM schema_migrations`, [], { fullResults: true });
  const applied = new Set(appliedResult.rows.map((row) => String(row.id)));

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    await sql.transaction(
      (tx) => [
        ...migration.statements.map((statement) => tx.query(statement)),
        tx.query(`INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT(id) DO NOTHING`, [migration.id]),
      ],
      { isolationMode: "Serializable" },
    );
    console.log(`Applied database migration ${migration.id}`);
  }
}

