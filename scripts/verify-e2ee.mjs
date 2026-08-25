import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

const baseUrl = (process.env.Z4SK_VERIFY_URL || "http://localhost:3001").replace(/\/$/, "");
const context = new TextEncoder().encode("z4sk-response-v1");
const b64 = (bytes) => Buffer.from(bytes).toString("base64url");
const unb64 = (value) => new Uint8Array(Buffer.from(value, "base64url"));

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  return { response, body };
}

async function derive(privateKey, publicKey, salt, usage) {
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256));
  try {
    const material = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: context }, material, { name: "AES-GCM", length: 256 }, false, [usage]);
  } finally {
    shared.fill(0);
  }
}

async function encrypt(payload, recipientPublicJwk) {
  const recipientPublic = await crypto.subtle.importKey("jwk", recipientPublicJwk, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const ephemeralJwk = await crypto.subtle.exportKey("jwk", ephemeral.publicKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(ephemeral.privateKey, recipientPublic, salt, "encrypt");
  const clear = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: context, tagLength: 128 }, key, clear);
    return { v: 1, alg: "ECDH-P256+HKDF-SHA256+A256GCM", ephemeralPublicKey: { kty: "EC", crv: "P-256", x: ephemeralJwk.x, y: ephemeralJwk.y }, salt: b64(salt), iv: b64(iv), ciphertext: b64(new Uint8Array(ciphertext)) };
  } finally {
    clear.fill(0); salt.fill(0); iv.fill(0);
  }
}

async function decrypt(envelope, recipientPrivateJwk) {
  const privateKey = await crypto.subtle.importKey("jwk", recipientPrivateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const ephemeralPublic = await crypto.subtle.importKey("jwk", { ...envelope.ephemeralPublicKey, ext: true }, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const salt = unb64(envelope.salt);
  const iv = unb64(envelope.iv);
  const ciphertext = unb64(envelope.ciphertext);
  const key = await derive(privateKey, ephemeralPublic, salt, "decrypt");
  let clear = new Uint8Array();
  try {
    clear = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: context, tagLength: 128 }, key, ciphertext));
    return JSON.parse(new TextDecoder().decode(clear));
  } finally {
    clear.fill(0); salt.fill(0); iv.fill(0); ciphertext.fill(0);
  }
}

const creatorKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
const publicJwk = await crypto.subtle.exportKey("jwk", creatorKeys.publicKey);
const privateJwk = await crypto.subtle.exportKey("jwk", creatorKeys.privateKey);
const questions = ["Synthetic privacy check one?", "Synthetic privacy check two?", "Synthetic privacy check three?"];

const created = await json("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ creatorName: "E2EE verifier", recipientName: "Synthetic recipient", title: "Synthetic E2EE verification", level: "curioso", locale: "en", libraryVersion: "2026.08", questions, encryptionPublicKey: { kty: "EC", crv: "P-256", x: publicJwk.x, y: publicJwk.y }, viewOnce: true, doubleBlind: true, expiresInHours: 12, packSlug: "original", source: "e2ee-verifier" }) });
assert.equal(created.response.status, 201, JSON.stringify(created.body));
const admin = new URL(created.body.adminUrl);
const gameId = admin.pathname.split("/").pop();
const bearer = new URLSearchParams(admin.hash.slice(1)).get("key");
assert.ok(gameId && bearer);

const privatePayload = { respondentName: "Synthetic respondent", answers: ["private alpha", "private beta", "private gamma"], reactions: ["🔥", "", "❤️"], matchInterest: true };
const envelope = await encrypt(privatePayload, { kty: "EC", crv: "P-256", x: publicJwk.x, y: publicJwk.y, ext: true });
const concurrentSubmissions = await Promise.all([1, 2].map(() => json(`/api/games/${gameId}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ encryptedResponse: envelope, answerCount: questions.length }) })));
assert.deepEqual(concurrentSubmissions.map(({ response }) => response.status).sort(), [201, 409], "Concurrent single-use submissions were both accepted.");

const beforeConsume = await json(`/api/games/${gameId}/responses`, { headers: { authorization: `Bearer ${bearer}` } });
assert.equal(beforeConsume.body.sealed, true);
assert.deepEqual(beforeConsume.body.responses, []);

const consumed = await json(`/api/games/${gameId}/consume`, { method: "POST", headers: { authorization: `Bearer ${bearer}` } });
assert.equal(consumed.response.status, 200, JSON.stringify(consumed.body));
assert.deepEqual(await decrypt(consumed.body.response.encryptedPayload, privateJwk), privatePayload);

const afterConsume = await json(`/api/games/${gameId}`);
assert.equal(afterConsume.response.status, 404, "The invitation still exists after view-once consumption.");
const secondConsume = await json(`/api/games/${gameId}/consume`, { method: "POST", headers: { authorization: `Bearer ${bearer}` } });
assert.equal(secondConsume.response.status, 403, "Consumed ciphertext was returned twice.");

const recipientDeleteGame = await json("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ creatorName: "Delete verifier", recipientName: "Synthetic recipient", level: "curioso", locale: "en", libraryVersion: "2026.08", questions, encryptionPublicKey: { kty: "EC", crv: "P-256", x: publicJwk.x, y: publicJwk.y }, viewOnce: false, expiresInHours: 12, packSlug: "original", source: "e2ee-verifier" }) });
assert.equal(recipientDeleteGame.response.status, 201, JSON.stringify(recipientDeleteGame.body));
const recipientAdmin = new URL(recipientDeleteGame.body.adminUrl);
const recipientGameId = recipientAdmin.pathname.split("/").pop();
const recipientBearer = new URLSearchParams(recipientAdmin.hash.slice(1)).get("key");
assert.ok(recipientGameId && recipientBearer);
const recipientSubmission = await json(`/api/games/${recipientGameId}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ encryptedResponse: envelope, answerCount: questions.length }) });
assert.equal(recipientSubmission.response.status, 201, JSON.stringify(recipientSubmission.body));
assert.ok(recipientSubmission.body.responseId && recipientSubmission.body.deletionToken);
const queryKeyAttempt = await json(`/api/games/${recipientGameId}/responses?key=legacy-query-token-must-not-work`);
assert.equal(queryKeyAttempt.response.status, 403, "A legacy query-string creator key was accepted.");
const recipientDeleted = await json(`/api/games/${recipientGameId}/responses`, { method: "DELETE", headers: { "content-type": "application/json", authorization: `Bearer ${recipientSubmission.body.deletionToken}` }, body: JSON.stringify({ responseId: recipientSubmission.body.responseId }) });
assert.equal(recipientDeleted.response.status, 200, JSON.stringify(recipientDeleted.body));
const afterRecipientDelete = await json(`/api/games/${recipientGameId}/responses`, { headers: { authorization: `Bearer ${recipientBearer}` } });
assert.equal(afterRecipientDelete.body.game.responseCount, 0, "Recipient-deleted ciphertext remains in the creator dashboard.");
const cleanup = await json(`/api/games/${recipientGameId}`, { method: "DELETE", headers: { authorization: `Bearer ${recipientBearer}` } });
assert.equal(cleanup.response.status, 200, JSON.stringify(cleanup.body));

let exactExpiryCutoff = false;
if (process.env.DATABASE_URL) {
  const expiryGame = await json("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ creatorName: "Expiry verifier", recipientName: "Synthetic recipient", level: "curioso", locale: "en", libraryVersion: "2026.08", questions, encryptionPublicKey: { kty: "EC", crv: "P-256", x: publicJwk.x, y: publicJwk.y }, viewOnce: false, expiresInHours: 12, packSlug: "original", source: "e2ee-verifier" }) });
  assert.equal(expiryGame.response.status, 201, JSON.stringify(expiryGame.body));
  const expiryAdmin = new URL(expiryGame.body.adminUrl);
  const expiryGameId = expiryAdmin.pathname.split("/").pop();
  const expiryBearer = new URLSearchParams(expiryAdmin.hash.slice(1)).get("key");
  assert.ok(expiryGameId && expiryBearer);
  const expirySubmission = await json(`/api/games/${expiryGameId}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ encryptedResponse: envelope, answerCount: questions.length }) });
  assert.equal(expirySubmission.response.status, 201, JSON.stringify(expirySubmission.body));
  const sql = neon(process.env.DATABASE_URL);
  await sql`UPDATE games SET expires_at = ${new Date(Date.now() - 1_000).toISOString()} WHERE id = ${expiryGameId}`;
  const expiredPrivateRead = await json(`/api/games/${expiryGameId}/responses`, { headers: { authorization: `Bearer ${expiryBearer}` } });
  assert.equal(expiredPrivateRead.response.status, 410, "The creator dashboard could read an expired response.");
  const [activeExpiredGame] = await sql`SELECT COUNT(*)::int AS count FROM games WHERE id = ${expiryGameId}`;
  const [activeExpiredResponse] = await sql`SELECT COUNT(*)::int AS count FROM responses WHERE game_id = ${expiryGameId}`;
  assert.equal(activeExpiredGame.count, 0, "Expired invitation was not opportunistically deleted.");
  assert.equal(activeExpiredResponse.count, 0, "Expired response remained in the active database.");
  exactExpiryCutoff = true;
}

console.log(JSON.stringify({ ok: true, baseUrl, algorithm: envelope.alg, plaintextSentToDatabase: false, activeGameAfterConsume: false, ciphertextReadableWithCreatorKey: true, concurrentSingleUseAccepted: 1, recipientSelfDeletion: true, queryStringKeysRejected: true, exactExpiryCutoff }));
