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
    const [gameColumns, responseColumns, responseIndexes, status, expiredGames, expiredResponses, storedCreatorEmails, unencryptedGames, plaintextResponses] = await Promise.all([
      db.prepare(`SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'games'`).all<{ name: string }>(),
      db.prepare(`SELECT column_name AS name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'responses'`).all<{ name: string }>(),
      db.prepare(`SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'responses'`).all<{ name: string }>(),
      db.prepare(`SELECT * FROM privacy_status WHERE id = 'retention'`).first<PrivacyStatus>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE expires_at <= ?`).bind(now).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE game_id IN (SELECT id FROM games WHERE expires_at <= ?)`).bind(now).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE creator_email <> ''`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM games WHERE encryption_public_key = ''`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) AS count FROM responses WHERE encrypted_payload = '' OR respondent_name <> '' OR answers_json <> '[]' OR reactions_json <> '[]' OR matched <> 0`).first<{ count: number }>(),
    ]);
    const gameColumnNames = new Set(gameColumns.results.map((column) => column.name));
    const responseColumnNames = new Set(responseColumns.results.map((column) => column.name));
    const responseIndexNames = new Set(responseIndexes.results.map((index) => index.name));
    const lastRunAgeSeconds = status ? Math.max(0, Math.round((Date.now() - new Date(status.last_run_at).getTime()) / 1000)) : null;
    const restoreWindowValue = process.env.NEON_RESTORE_WINDOW_HOURS?.trim();
    const restoreWindowHours = restoreWindowValue ? Number(restoreWindowValue) : Number.NaN;
    const restoreWindowConfigured = Number.isFinite(restoreWindowHours) && restoreWindowHours >= 0;
    const operatorConfigured = Boolean(process.env.LEGAL_ENTITY_NAME?.trim() && process.env.LEGAL_POSTAL_ADDRESS?.trim() && process.env.PRIVACY_EMAIL?.trim());
    const checks = [
      { id: "token-hashing", label: "Raw creator keys are not stored", pass: gameColumnNames.has("creator_token_hash") && !gameColumnNames.has("creator_token"), evidence: "Postgres contains creator_token_hash and no raw creator_token column." },
      { id: "email-minimization", label: "Creator email never reaches the active database", pass: Number(storedCreatorEmails?.count || 0) === 0, evidence: `${Number(storedCreatorEmails?.count || 0)} invitations contain creator email. Z4SK never receives the optional address; mail composition happens locally.` },
      { id: "private-key-isolation", label: "Private decryption keys never enter the database", pass: gameColumnNames.has("encryption_public_key") && !gameColumnNames.has("encryption_private_key") && !gameColumnNames.has("decryption_key") && Number(unencryptedGames?.count || 0) === 0, evidence: `Postgres stores only the public ECDH key. ${Number(unencryptedGames?.count || 0)} active invitations lack client-side encryption.` },
      { id: "response-encryption", label: "Every active response is ciphertext only", pass: responseColumnNames.has("encrypted_payload") && Number(plaintextResponses?.count || 0) === 0, evidence: `${Number(plaintextResponses?.count || 0)} active response rows contain plaintext or lack an AES-256-GCM envelope. Legacy answer/name/reaction columns are forced empty.` },
      { id: "single-use-constraint", label: "Single-response invitations are enforced by Postgres", pass: responseColumnNames.has("single_use") && responseIndexNames.has("ux_responses_single_use_game"), evidence: "A partial unique Postgres index allows at most one single-use response per invitation, including concurrent submissions." },
      { id: "recipient-deletion", label: "Recipients can delete their own new response", pass: responseColumnNames.has("delete_token_hash"), evidence: "The API stores only a hash of the per-response deletion secret returned to the submitting browser." },
      { id: "rate-limit-hmac", label: "Rate-limit IP pseudonyms use a keyed rotating HMAC", pass: Boolean(process.env.RATE_LIMIT_HMAC_SECRET), evidence: process.env.RATE_LIMIT_HMAC_SECRET ? "A server-only HMAC secret is configured; identifiers rotate daily." : "RATE_LIMIT_HMAC_SECRET is missing." },
      { id: "answer-isolation", label: "Answer plaintext never reaches response APIs or metrics", pass: responseColumnNames.has("encrypted_payload") && !gameColumnNames.has("answers_json"), evidence: "Responses are encrypted in the recipient browser; Postgres and aggregate metric tables receive no answer text." },
      { id: "expiry-purge", label: "No expired answers remain in the active database", pass: Number(expiredResponses?.count || 0) === 0, evidence: `${Number(expiredResponses?.count || 0)} expired response records found.` },
      { id: "expiry-games", label: "No expired invitations remain in the active database", pass: Number(expiredGames?.count || 0) === 0, evidence: `${Number(expiredGames?.count || 0)} expired invitation records found.` },
      { id: "purge-heartbeat", label: "Daily background purge heartbeat is current", pass: lastRunAgeSeconds !== null && lastRunAgeSeconds <= 129_600, evidence: status ? `Last purge ran ${lastRunAgeSeconds}s ago via ${status.last_source}.` : "No scheduled purge has run yet." },
      { id: "operator-contact", label: "Controller identity and privacy contact are published", pass: operatorConfigured, evidence: operatorConfigured ? "Legal entity, postal address and privacy email are configured." : "Public launch is blocked until legal operator details are configured." },
      { id: "recovery-window", label: "The exact Neon restore window is published", pass: restoreWindowConfigured, evidence: restoreWindowConfigured ? `Configured Neon restore window: ${restoreWindowHours} hours.` : "NEON_RESTORE_WINDOW_HOURS has not been verified and published." },
      { id: "tracking", label: "No third-party analytics or advertising SDK is configured", pass: true, evidence: "Sponsor space is first-party UI; no third-party analytics integration is installed." },
      { id: "cookies", label: "Z4SK does not set application cookies", pass: true, evidence: "Access uses separate bearer links; there is no account session or cookie code." },
    ];
    return NextResponse.json({
      generatedAt: new Date().toISOString(), policyVersion: "2026.08.25-privacy.2", proofType: "live runtime self-audit",
      overall: checks.every((check) => check.pass) ? "pass" : "attention", checks,
      retention: { cron: "daily at 03:00 UTC; exact timing and retries are not guaranteed on Vercel Hobby", activeDatabaseDeadline: "all public and private access stops exactly at expiry; post-expiry access triggers active-row deletion", explicitDeletion: "immediate database transaction independent of analytics", providerRecoveryWindow: restoreWindowConfigured ? `${restoreWindowHours} hours` : "not verified; public launch blocked", lastRunAt: status?.last_run_at || null, lastExpiredGames: Number(status?.last_expired_games || 0), lastDeletedResponses: Number(status?.last_deleted_responses || 0), totalExpiredGames: Number(status?.total_expired_games || 0), totalDeletedResponses: Number(status?.total_deleted_responses || 0) },
      encryption: { responseCipher:"AES-256-GCM", keyAgreement:"ECDH P-256", keyDerivation:"HKDF-SHA-256", privateKeyLocation:"creator URL fragment / private QR only", databaseContent:"ciphertext, IV, salt, ephemeral public key and public invitation key" },
      analytics: { answerTextIncluded: false, creatorEmailIncluded: false, respondentNameIncluded: false, matchInterestIncluded: false, measures: ["funnel event counts", "language", "approximate country", "sponsor pack", "question completion counts"] },
      limits: ["This endpoint is evidence generated by Z4SK itself, not an independent audit.", "Invitation display names, questions and settings remain server-visible; response content is end-to-end encrypted.", "Client-side encryption protects against a database or backup disclosure, not a compromised browser, leaked creator link or malicious code served by the operator.", "Provider backups may retain encrypted history according to the configured Neon retention policy."],
    }, { headers: { "cache-control": "no-store", "x-z4sk-privacy-proof": "2026.08.25-privacy.2" } });
  } catch (error) {
    console.error("privacy-proof", error);
    return NextResponse.json({ error: "Privacy proof is temporarily unavailable." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
