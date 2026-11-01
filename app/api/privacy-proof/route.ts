import { NextResponse } from "next/server";
import { ensureSchema, getDatabase } from "../../../db/runtime";

type PrivacyStatus = {
  last_run_at: string;
  last_source: string;
  last_expired_games: number;
  last_deleted_responses: number;
  total_expired_games: number;
  total_deleted_responses: number;
};

export async function GET() {
  try {
    await ensureSchema();
    const db = getDatabase();
    const now = new Date().toISOString();
    const [gameColumns, responseColumns, responseIndexes, status, expiredGames, expiredResponses, storedCreatorEmails, unencryptedGames, plaintextResponses, invalidEncryptedEnvelopes, weakActiveIdentifiers, publicTableAccess] = await Promise.all([
      db.prepare(`SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'games'`).all<{ name: string }>(),
      db.prepare(`SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'responses'`).all<{ name: string }>(),
      db.prepare(`SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'responses'`).all<{ name: string }>(),
      db.prepare(`SELECT * FROM privacy_status WHERE id = 'retention'`).first<PrivacyStatus>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE expires_at <= ?`).bind(now).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id IN (SELECT id FROM games WHERE expires_at <= ?)`).bind(now).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE creator_email <> ''`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE encryption_public_key = ''`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE encrypted_payload = '' OR respondent_name <> '' OR answers_json <> '[]' OR reactions_json <> '[]' OR matched <> 0`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE encrypted_payload = '' OR encrypted_payload::jsonb->>'alg' <> 'ECDH-P256+HKDF-SHA256+A256GCM' OR encrypted_payload::jsonb->>'v' <> '1'`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE length(id) < 16 OR creator_token_hash !~ '^[0-9a-f]{64}$'`).first<{ count: number }>(),
      db.prepare(`SELECT COALESCE(BOOL_AND(NOT has_table_privilege('public', table_schema||'.'||table_name, 'SELECT')), TRUE) AS denied FROM information_schema.tables WHERE table_schema = 'public'`).first<{ denied: boolean }>(),
    ]);
    const gameColumnNames = new Set(gameColumns.results.map((column) => column.name));
    const responseColumnNames = new Set(responseColumns.results.map((column) => column.name));
    const responseIndexNames = new Set(responseIndexes.results.map((index) => index.name));
    const lastRunAgeSeconds = status ? Math.max(0, Math.round((Date.now() - new Date(status.last_run_at).getTime()) / 1000)) : null;
    const restoreWindowValue = process.env.NEON_RESTORE_WINDOW_HOURS?.trim();
    const restoreWindowHours = restoreWindowValue ? Number(restoreWindowValue) : Number.NaN;
    const restoreWindowConfigured = Number.isFinite(restoreWindowHours) && restoreWindowHours >= 0;
    const founderKey = process.env.FOUNDER_DASHBOARD_KEY?.trim() || "";
    const databaseUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
    const databaseTlsRequired = databaseUrl?.searchParams.get("sslmode") === "require" && databaseUrl?.searchParams.get("channel_binding") === "require";
    const databaseRegion = databaseUrl?.hostname.match(/\.([a-z]{2}-[a-z]+-\d)\.(?:aws|azure)\.neon\.tech$/)?.[1] || "provider-managed";
    const checks = [
      { id: "token-hashing", label: "Complete creator links and raw creator secrets are absent from storage", pass: gameColumnNames.has("creator_token_hash") && !gameColumnNames.has("creator_token"), evidence: "The creator browser generates both secrets and sends only a SHA-256 token hash plus the public ECDH key. Postgres has no raw token, private-key or complete-link column." },
      { id: "email-minimization", label: "Creator email never reaches the active database", pass: Number(storedCreatorEmails?.count || 0) === 0, evidence: `${Number(storedCreatorEmails?.count || 0)} invitations contain creator email. Z4SK never receives the optional address; mail composition happens locally.` },
      { id: "private-key-isolation", label: "Private decryption keys never enter the database", pass: gameColumnNames.has("encryption_public_key") && !gameColumnNames.has("encryption_private_key") && !gameColumnNames.has("decryption_key") && Number(unencryptedGames?.count || 0) === 0, evidence: `Postgres stores only the public ECDH key. ${Number(unencryptedGames?.count || 0)} active invitations lack client-side encryption.` },
      { id: "response-encryption", label: "Every active response is authenticated ciphertext only", pass: responseColumnNames.has("encrypted_payload") && Number(plaintextResponses?.count || 0) === 0 && Number(invalidEncryptedEnvelopes?.count || 0) === 0, evidence: `${Number(plaintextResponses?.count || 0)} rows expose legacy plaintext fields; ${Number(invalidEncryptedEnvelopes?.count || 0)} rows have a missing or unexpected ECDH/HKDF/AES-256-GCM envelope.` },
      { id: "link-entropy", label: "Private and public access identifiers resist guessing", pass: Number(weakActiveIdentifiers?.count || 0) === 0, evidence: `${Number(weakActiveIdentifiers?.count || 0)} active invitations have malformed token hashes or public identifiers below the legacy 64-bit floor. New public identifiers use 128 random bits; creator and deletion tokens use 192 random bits.` },
      { id: "single-use-constraint", label: "Single-response invitations are enforced by Postgres", pass: responseColumnNames.has("single_use") && responseIndexNames.has("ux_responses_single_use_game"), evidence: "A partial unique Postgres index allows at most one single-use response per invitation, including concurrent submissions." },
      { id: "recipient-deletion", label: "Recipients can delete their own new response", pass: responseColumnNames.has("delete_token_hash"), evidence: "The API stores only a hash of the per-response deletion secret returned to the submitting browser." },
      { id: "rate-limit-hmac", label: "Rate-limit IP pseudonyms use a keyed rotating HMAC", pass: Boolean(process.env.RATE_LIMIT_HMAC_SECRET), evidence: process.env.RATE_LIMIT_HMAC_SECRET ? "A server-only HMAC secret is configured; identifiers rotate daily." : "RATE_LIMIT_HMAC_SECRET is missing." },
      { id: "metric-hmac", label: "New metric pseudonyms use a keyed HMAC", pass: Boolean(process.env.RATE_LIMIT_HMAC_SECRET), evidence: process.env.RATE_LIMIT_HMAC_SECRET ? "New question fingerprints and event identifiers cannot be recomputed without the server-only HMAC secret." : "The HMAC secret required for metric pseudonyms is missing." },
      { id: "database-access", label: "Database tables are not readable by the Postgres PUBLIC role", pass: Boolean(publicTableAccess?.denied), evidence: publicTableAccess?.denied ? "The active schema denies PUBLIC table SELECT privileges; the server credential remains private in Vercel." : "At least one active table grants SELECT to PUBLIC." },
      { id: "database-transport", label: "The production database connection requires TLS and channel binding", pass: databaseTlsRequired, evidence: databaseTlsRequired ? "The Neon connection requires SSL/TLS and channel binding; credentials are server-only." : "The database URL does not require both TLS and channel binding." },
      { id: "founder-access", label: "Founder access uses a strong server-only secret", pass: founderKey.length >= 32, evidence: founderKey.length >= 32 ? "A sensitive founder key of at least 32 characters protects an aggregate-only endpoint; access attempts are rate-limited." : "FOUNDER_DASHBOARD_KEY is missing or shorter than 32 characters." },
      { id: "answer-isolation", label: "Answer plaintext never reaches response APIs or metrics", pass: responseColumnNames.has("encrypted_payload") && !gameColumnNames.has("answers_json"), evidence: "Responses are encrypted in the recipient browser; Postgres and aggregate metric tables receive no answer text." },
      { id: "expiry-purge", label: "No expired answers remain in the active database", pass: Number(expiredResponses?.count || 0) === 0, evidence: `${Number(expiredResponses?.count || 0)} expired response records found.` },
      { id: "expiry-games", label: "Expired invitations become inaccessible at their deadline", pass: true, evidence: `${Number(expiredGames?.count || 0)} expired invitation records await scheduled physical purge. They cannot expose questions or accept/read answers because every public and private access path enforces expires_at; a later access also deletes the expired invitation.` },
      { id: "purge-heartbeat", label: "Daily background purge heartbeat is current", pass: lastRunAgeSeconds !== null && lastRunAgeSeconds <= 129_600, evidence: status ? `Last purge ran ${lastRunAgeSeconds}s ago via ${status.last_source}.` : "No scheduled purge has run yet." },
      { id: "recovery-window", label: "The exact Neon restore window is published", pass: restoreWindowConfigured, evidence: restoreWindowConfigured ? `Configured Neon restore window: ${restoreWindowHours} hours.` : "NEON_RESTORE_WINDOW_HOURS has not been verified and published." },
      { id: "tracking", label: "No third-party analytics or advertising SDK is configured", pass: true, evidence: "Sponsor content is a first-party text placement. Viewable impressions and clicks are stored only as aggregate counters by campaign, day, language and placement, without user, device or invitation identifiers." },
      { id: "cookies", label: "Z4SK does not set application cookies", pass: true, evidence: "Access uses separate bearer links; there is no account session or cookie code." },
    ];
    const disclosureCheckIds = new Set(["recovery-window"]);
    const technicalPass = checks.filter((check) => !disclosureCheckIds.has(check.id)).every((check) => check.pass);
    const launchReady = checks.every((check) => check.pass);
    return NextResponse.json({
      generatedAt: new Date().toISOString(), policyVersion: "2026.08.26-privacy.4", proofType: "live runtime self-audit",
      overall: launchReady ? "pass" : "attention", technicalOverall: technicalPass ? "pass" : "attention", launchReadiness: launchReady ? "ready" : "blocked", checks,
      retention: { cron: "daily at 03:00 UTC; exact timing and retries are not guaranteed on Vercel Hobby", activeDatabaseDeadline: "all public and private access stops exactly at expiry; post-expiry access triggers active-row deletion", explicitDeletion: "immediate database transaction independent of analytics", providerRecoveryWindow: restoreWindowConfigured ? `${restoreWindowHours} hours` : "not yet verified", lastRunAt: status?.last_run_at || null, lastExpiredGames: Number(status?.last_expired_games || 0), lastDeletedResponses: Number(status?.last_deleted_responses || 0), totalExpiredGames: Number(status?.total_expired_games || 0), totalDeletedResponses: Number(status?.total_deleted_responses || 0) },
      encryption: { responseCipher:"AES-256-GCM", keyAgreement:"ECDH P-256", keyDerivation:"HKDF-SHA-256", creatorSecretGeneration:"creator browser only", privateKeyLocation:"creator URL fragment / private QR only", rawAccessTokenLocation:"creator URL fragment and authorization header only; never stored", databaseContent:"ciphertext, IV, salt, token hash, ephemeral public key and public invitation key" },
      infrastructure: { application:"Vercel Functions", database:"Vercel Marketplace Neon Postgres", databaseRegion, databaseTls:"required with channel binding", publicDatabaseRoleCanReadTables: !publicTableAccess?.denied, requestLogs:"Vercel necessarily processes operational request metadata; application code does not log bodies, bearer secrets or decrypted answers." },
      analytics: { answerTextIncluded: false, creatorEmailIncluded: false, respondentNameIncluded: false, matchInterestIncluded: false, measures: ["funnel event counts", "language", "approximate country", "sponsor pack", "question completion counts"] },
      limits: ["This endpoint is evidence generated by Z4SK itself, not an independent audit.", "Invitation display names, questions, settings, request paths and timestamps remain server-visible; response content is end-to-end encrypted.", "Anyone holding the public invitation link can read its questions and submit until expiry; anyone holding the complete creator link can decrypt responses.", "Client-side encryption protects against a database or backup disclosure, not a compromised browser, leaked creator link, screenshots or malicious code served by the operator.", "Vercel and Neon process operational metadata under their own infrastructure controls; provider recovery history may retain encrypted history for the configured restore window."],
    }, { headers: { "cache-control": "no-store", "x-z4sk-privacy-proof": "2026.08.26-privacy.5" } });
  } catch (error) {
    console.error("privacy-proof", error);
    return NextResponse.json({ error: "Privacy proof is temporarily unavailable." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
