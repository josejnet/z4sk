import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

const baseUrl = (
  process.env.Z4SK_VERIFY_URL || "http://localhost:3001"
).replace(/\/$/, "");
const context = new TextEncoder().encode("z4sk-response-v1");
const invitationKeyContext = new TextEncoder().encode("z4sk-invitation-key-v2");
const invitationLinkOnlyKeyContext = new TextEncoder().encode(
  "z4sk-invitation-key-v2-link-only",
);
const invitationContentContext = new TextEncoder().encode(
  "z4sk-invitation-content-v2",
);
const b64 = (bytes) => Buffer.from(bytes).toString("base64url");
const unb64 = (value) => new Uint8Array(Buffer.from(value, "base64url"));
const testRunIp = `2001:db8:${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}::1`;

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "x-forwarded-for": testRunIp, ...init?.headers },
  });
  const body = await response.json();
  return { response, body };
}

async function creatorCredential() {
  const token = b64(crypto.getRandomValues(new Uint8Array(24)));
  const tokenHash = Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
  ).toString("hex");
  return { token, tokenHash };
}

async function derive(privateKey, publicKey, salt, usage) {
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: publicKey },
      privateKey,
      256,
    ),
  );
  try {
    const material = await crypto.subtle.importKey(
      "raw",
      shared,
      "HKDF",
      false,
      ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info: context },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      [usage],
    );
  } finally {
    shared.fill(0);
  }
}

async function encrypt(payload, recipientPublicJwk) {
  const recipientPublic = await crypto.subtle.importKey(
    "jwk",
    recipientPublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const ephemeralJwk = await crypto.subtle.exportKey(
    "jwk",
    ephemeral.publicKey,
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(
    ephemeral.privateKey,
    recipientPublic,
    salt,
    "encrypt",
  );
  const clear = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: context, tagLength: 128 },
      key,
      clear,
    );
    return {
      v: 1,
      alg: "ECDH-P256+HKDF-SHA256+A256GCM",
      ephemeralPublicKey: {
        kty: "EC",
        crv: "P-256",
        x: ephemeralJwk.x,
        y: ephemeralJwk.y,
      },
      salt: b64(salt),
      iv: b64(iv),
      ciphertext: b64(new Uint8Array(ciphertext)),
    };
  } finally {
    clear.fill(0);
    salt.fill(0);
    iv.fill(0);
  }
}

async function decrypt(envelope, recipientPrivateJwk) {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    recipientPrivateJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
  const ephemeralPublic = await crypto.subtle.importKey(
    "jwk",
    { ...envelope.ephemeralPublicKey, ext: true },
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const salt = unb64(envelope.salt);
  const iv = unb64(envelope.iv);
  const ciphertext = unb64(envelope.ciphertext);
  const key = await derive(privateKey, ephemeralPublic, salt, "decrypt");
  let clear = new Uint8Array();
  try {
    clear = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: context, tagLength: 128 },
        key,
        ciphertext,
      ),
    );
    return JSON.parse(new TextDecoder().decode(clear));
  } finally {
    clear.fill(0);
    salt.fill(0);
    iv.fill(0);
    ciphertext.fill(0);
  }
}

async function encryptInvitation(
  payload,
  secret = b64(crypto.getRandomValues(new Uint8Array(32))),
  sharedKey = b64(crypto.getRandomValues(new Uint8Array(16))),
) {
  const keyMode = sharedKey ? "shared" : "link";
  const keyContext =
    keyMode === "shared" ? invitationKeyContext : invitationLinkOnlyKeyContext;
  const secretBytes = unb64(secret);
  const sharedBytes = sharedKey ? unb64(sharedKey) : new Uint8Array();
  const input = new Uint8Array(secretBytes.length + sharedBytes.length);
  input.set(secretBytes);
  input.set(sharedBytes, secretBytes.length);
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const contentKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const clear = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const material = await crypto.subtle.importKey(
      "raw",
      input,
      "HKDF",
      false,
      ["deriveKey"],
    );
    const [wrappingKey, contentKey] = await Promise.all([
      crypto.subtle.deriveKey(
        { name: "HKDF", hash: "SHA-256", salt, info: keyContext },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"],
      ),
      crypto.subtle.importKey("raw", contentKeyBytes, "AES-GCM", false, [
        "encrypt",
      ]),
    ]);
    const [wrappedKey, ciphertext] = await Promise.all([
      crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: keyIv,
          additionalData: keyContext,
          tagLength: 128,
        },
        wrappingKey,
        contentKeyBytes,
      ),
      crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
          additionalData: invitationContentContext,
          tagLength: 128,
        },
        contentKey,
        clear,
      ),
    ]);
    return {
      secret,
      sharedKey,
      envelope: {
        v: 2,
        alg: "HKDF-SHA256+A256GCM+A256GCM",
        keyMode,
        salt: b64(salt),
        keyIv: b64(keyIv),
        wrappedKey: b64(new Uint8Array(wrappedKey)),
        iv: b64(iv),
        ciphertext: b64(new Uint8Array(ciphertext)),
      },
    };
  } finally {
    secretBytes.fill(0);
    sharedBytes.fill(0);
    input.fill(0);
    salt.fill(0);
    keyIv.fill(0);
    iv.fill(0);
    contentKeyBytes.fill(0);
    clear.fill(0);
  }
}

async function decryptInvitation(envelope, secret, sharedKey) {
  const keyMode = envelope.keyMode || "shared";
  const keyContext =
    keyMode === "shared" ? invitationKeyContext : invitationLinkOnlyKeyContext;
  const secretBytes = unb64(secret);
  const sharedBytes = sharedKey ? unb64(sharedKey) : new Uint8Array();
  const input = new Uint8Array(secretBytes.length + sharedBytes.length);
  input.set(secretBytes);
  input.set(sharedBytes, secretBytes.length);
  const salt = unb64(envelope.salt);
  const keyIv = unb64(envelope.keyIv);
  const wrappedKey = unb64(envelope.wrappedKey);
  const iv = unb64(envelope.iv);
  const ciphertext = unb64(envelope.ciphertext);
  let contentKeyBytes = new Uint8Array();
  let clear = new Uint8Array();
  try {
    const material = await crypto.subtle.importKey(
      "raw",
      input,
      "HKDF",
      false,
      ["deriveKey"],
    );
    const wrappingKey = await crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info: keyContext },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    contentKeyBytes = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: keyIv,
          additionalData: keyContext,
          tagLength: 128,
        },
        wrappingKey,
        wrappedKey,
      ),
    );
    const contentKey = await crypto.subtle.importKey(
      "raw",
      contentKeyBytes,
      "AES-GCM",
      false,
      ["decrypt"],
    );
    clear = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
          additionalData: invitationContentContext,
          tagLength: 128,
        },
        contentKey,
        ciphertext,
      ),
    );
    return JSON.parse(new TextDecoder().decode(clear));
  } finally {
    secretBytes.fill(0);
    sharedBytes.fill(0);
    input.fill(0);
    salt.fill(0);
    keyIv.fill(0);
    wrappedKey.fill(0);
    iv.fill(0);
    ciphertext.fill(0);
    contentKeyBytes.fill(0);
    clear.fill(0);
  }
}

const creatorKeys = await crypto.subtle.generateKey(
  { name: "ECDH", namedCurve: "P-256" },
  true,
  ["deriveBits"],
);
const publicJwk = await crypto.subtle.exportKey("jwk", creatorKeys.publicKey);
const privateJwk = await crypto.subtle.exportKey("jwk", creatorKeys.privateKey);
const questions = [
  "Synthetic privacy check one?",
  "Synthetic privacy check two?",
  "Synthetic privacy check three?",
];
const responsePublicKey = {
  kty: "EC",
  crv: "P-256",
  x: publicJwk.x,
  y: publicJwk.y,
};

function privateInvitation(overrides = {}) {
  return {
    creatorName: "E2EE verifier",
    recipientName: "Synthetic recipient",
    title: "Synthetic E2EE verification",
    level: "curioso",
    locale: "en",
    libraryVersion: "2026.11",
    questions,
    encryptionPublicKey: responsePublicKey,
    timedMode: false,
    packSlug: "original",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function createEncryptedGame(
  access,
  {
    viewOnce = false,
    invitationOverrides = {},
    expiresInHours = 12,
    useSharedKey = true,
  } = {},
) {
  const submissionAccess = await creatorCredential();
  const encrypted = await encryptInvitation(
    privateInvitation(invitationOverrides),
    undefined,
    useSharedKey
      ? b64(crypto.getRandomValues(new Uint8Array(16)))
      : "",
  );
  const result = await json("/api/games", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      encryptedInvitation: encrypted.envelope,
      keyMode: encrypted.envelope.keyMode,
      questionCount: questions.length,
      creatorTokenHash: access.tokenHash,
      submissionTokenHash: submissionAccess.tokenHash,
      viewOnce,
      expiresInHours,
      source: "e2ee-verifier",
    }),
  });
  return {
    ...result,
    invitationSecret: encrypted.secret,
    sharedKey: encrypted.sharedKey,
    invitationEnvelope: encrypted.envelope,
    submissionToken: submissionAccess.token,
  };
}

const missingCredentialEnvelope = await encryptInvitation(
  privateInvitation({ creatorName: "No credential verifier" }),
);
const missingCredentialSubmission = await creatorCredential();
const missingClientSecret = await json("/api/games", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    encryptedInvitation: missingCredentialEnvelope.envelope,
    keyMode: missingCredentialEnvelope.envelope.keyMode,
    questionCount: questions.length,
    submissionTokenHash: missingCredentialSubmission.tokenHash,
  }),
});
assert.equal(
  missingClientSecret.response.status,
  400,
  "Creation succeeded without a browser-generated creator credential hash.",
);

const createdAccess = await creatorCredential();
const created = await createEncryptedGame(createdAccess, {
  viewOnce: true,
});
assert.equal(created.response.status, 201, JSON.stringify(created.body));
assert.equal(
  created.body.adminUrl,
  undefined,
  "The creation API returned a complete private link.",
);
const gameId = created.body.id;
const bearer = createdAccess.token;
assert.ok(gameId && bearer);
const publicGame = await json(`/api/games/${gameId}`);
assert.equal(publicGame.response.status, 200, JSON.stringify(publicGame.body));
assert.equal(
  publicGame.body.creatorName,
  undefined,
  "Public API exposed an encrypted creator name.",
);
assert.equal(
  publicGame.body.questions,
  undefined,
  "Public API exposed encrypted questions.",
);
assert.deepEqual(
  publicGame.body.encryptedInvitation,
  created.invitationEnvelope,
);
const decryptedCreatedInvitation = await decryptInvitation(
  publicGame.body.encryptedInvitation,
  created.invitationSecret,
  created.sharedKey,
);
await assert.rejects(
  decryptInvitation(
    publicGame.body.encryptedInvitation,
    created.invitationSecret,
    b64(crypto.getRandomValues(new Uint8Array(16))),
  ),
  "A different shared key decrypted the invitation.",
);
assert.equal(
  JSON.stringify(publicGame.body).includes(created.sharedKey),
  false,
  "The server returned the raw shared key.",
);
assert.equal(
  JSON.stringify(publicGame.body).includes(created.invitationSecret),
  false,
  "The server returned the raw link secret.",
);
assert.equal(decryptedCreatedInvitation.creatorName, "E2EE verifier");
assert.deepEqual(decryptedCreatedInvitation.questions, questions);

const linkOnlyAccess = await creatorCredential();
const linkOnlyGame = await createEncryptedGame(linkOnlyAccess, {
  invitationOverrides: { creatorName: "Link-only verifier" },
  useSharedKey: false,
});
assert.equal(
  linkOnlyGame.response.status,
  201,
  JSON.stringify(linkOnlyGame.body),
);
const linkOnlyPublic = await json(`/api/games/${linkOnlyGame.body.id}`);
assert.equal(linkOnlyPublic.response.status, 200, JSON.stringify(linkOnlyPublic.body));
assert.equal(linkOnlyPublic.body.encryptedInvitation.keyMode, "link");
const linkOnlyPlaintext = await decryptInvitation(
  linkOnlyPublic.body.encryptedInvitation,
  linkOnlyGame.invitationSecret,
  "",
);
assert.equal(linkOnlyPlaintext.creatorName, "Link-only verifier");
const linkOnlyCleanup = await json(`/api/games/${linkOnlyGame.body.id}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${linkOnlyAccess.token}` },
});
assert.equal(linkOnlyCleanup.response.status, 200, JSON.stringify(linkOnlyCleanup.body));

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  const [storedGame] =
    await sql`SELECT creator_name, recipient_name, title, questions_json, encryption_public_key, encrypted_invitation FROM games WHERE id = ${gameId}`;
  assert.equal(storedGame.creator_name, "");
  assert.equal(storedGame.recipient_name, "");
  assert.equal(storedGame.title, "");
  assert.equal(storedGame.questions_json, "[]");
  assert.equal(storedGame.encryption_public_key, "");
  assert.equal(
    String(storedGame.encrypted_invitation).includes("E2EE verifier"),
    false,
    "Database envelope contains invitation plaintext.",
  );
}

const privatePayload = {
  respondentName: "Synthetic respondent",
  answers: ["private alpha", "private beta", "private gamma"],
  reactions: ["🔥", "", "❤️"],
};
const envelope = await encrypt(privatePayload, {
  kty: "EC",
  crv: "P-256",
  x: publicJwk.x,
  y: publicJwk.y,
  ext: true,
});
const idOnlySubmission = await json(`/api/games/${gameId}/responses`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    encryptedResponse: envelope,
    answerCount: questions.length,
  }),
});
assert.equal(
  idOnlySubmission.response.status,
  403,
  "Knowing only the public game id allowed a forged response submission.",
);
const concurrentSubmissions = await Promise.all(
  [1, 2].map(() =>
    json(`/api/games/${gameId}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${created.submissionToken}`,
      },
      body: JSON.stringify({
        encryptedResponse: envelope,
        answerCount: questions.length,
      }),
    }),
  ),
);
assert.deepEqual(
  concurrentSubmissions.map(({ response }) => response.status).sort(),
  [201, 409],
  "Concurrent single-use submissions were both accepted.",
);

const beforeConsume = await json(`/api/games/${gameId}/responses`, {
  headers: { authorization: `Bearer ${bearer}` },
});
assert.equal(beforeConsume.body.sealed, true);
assert.deepEqual(beforeConsume.body.responses, []);

const consumed = await json(`/api/games/${gameId}/consume`, {
  method: "POST",
  headers: { authorization: `Bearer ${bearer}` },
});
assert.equal(consumed.response.status, 200, JSON.stringify(consumed.body));
assert.deepEqual(
  await decryptInvitation(
    consumed.body.encryptedInvitation,
    created.invitationSecret,
    created.sharedKey,
  ),
  decryptedCreatedInvitation,
);
assert.deepEqual(
  await decrypt(consumed.body.response.encryptedPayload, privateJwk),
  privatePayload,
);

const afterConsume = await json(`/api/games/${gameId}`);
assert.equal(
  afterConsume.response.status,
  404,
  "The invitation still exists after view-once consumption.",
);
const secondConsume = await json(`/api/games/${gameId}/consume`, {
  method: "POST",
  headers: { authorization: `Bearer ${bearer}` },
});
assert.equal(
  secondConsume.response.status,
  403,
  "Consumed ciphertext was returned twice.",
);

const recipientAccess = await creatorCredential();
const recipientDeleteGame = await createEncryptedGame(recipientAccess, {
  invitationOverrides: { creatorName: "Delete verifier" },
});
assert.equal(
  recipientDeleteGame.response.status,
  201,
  JSON.stringify(recipientDeleteGame.body),
);
const recipientGameId = recipientDeleteGame.body.id;
const recipientBearer = recipientAccess.token;
assert.ok(recipientGameId && recipientBearer);
const recipientSubmission = await json(
  `/api/games/${recipientGameId}/responses`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${recipientDeleteGame.submissionToken}`,
    },
    body: JSON.stringify({
      encryptedResponse: envelope,
      answerCount: questions.length,
    }),
  },
);
assert.equal(
  recipientSubmission.response.status,
  201,
  JSON.stringify(recipientSubmission.body),
);
assert.ok(
  recipientSubmission.body.responseId && recipientSubmission.body.deletionToken,
);
const queryKeyAttempt = await json(
  `/api/games/${recipientGameId}/responses?key=legacy-query-token-must-not-work`,
);
assert.equal(
  queryKeyAttempt.response.status,
  403,
  "A legacy query-string creator key was accepted.",
);
const recipientDeleted = await json(`/api/games/${recipientGameId}/responses`, {
  method: "DELETE",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${recipientSubmission.body.deletionToken}`,
  },
  body: JSON.stringify({ responseId: recipientSubmission.body.responseId }),
});
assert.equal(
  recipientDeleted.response.status,
  200,
  JSON.stringify(recipientDeleted.body),
);
const afterRecipientDelete = await json(
  `/api/games/${recipientGameId}/responses`,
  { headers: { authorization: `Bearer ${recipientBearer}` } },
);
assert.equal(
  afterRecipientDelete.body.game.responseCount,
  0,
  "Recipient-deleted ciphertext remains in the creator dashboard.",
);
const cleanup = await json(`/api/games/${recipientGameId}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${recipientBearer}` },
});
assert.equal(cleanup.response.status, 200, JSON.stringify(cleanup.body));

const reportAccess = await creatorCredential();
const reportGame = await createEncryptedGame(reportAccess, {
  invitationOverrides: {
    creatorName: "Metadata must stay private",
    recipientName: "Private recipient",
  },
});
assert.equal(reportGame.response.status, 201, JSON.stringify(reportGame.body));
const reportGameId = reportGame.body.id;
const reporterPrefix = `2001:db8:${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
const firstReport = await json(`/api/games/${reportGameId}/report`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-forwarded-for": `${reporterPrefix}::1`,
  },
  body: JSON.stringify({ reason: "spam" }),
});
assert.equal(
  firstReport.response.status,
  201,
  JSON.stringify(firstReport.body),
);
const duplicateReport = await json(`/api/games/${reportGameId}/report`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-forwarded-for": `${reporterPrefix}::1`,
  },
  body: JSON.stringify({ reason: "spam" }),
});
assert.equal(
  duplicateReport.response.status,
  200,
  JSON.stringify(duplicateReport.body),
);
assert.equal(
  duplicateReport.body.duplicate,
  true,
  "A duplicate reporter was counted twice.",
);
const secondReporter = await json(`/api/games/${reportGameId}/report`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-forwarded-for": `${reporterPrefix}::2`,
  },
  body: JSON.stringify({ reason: "privacy" }),
});
assert.equal(
  secondReporter.body.automaticallyClosed,
  false,
  "Two reporters closed an invitation.",
);
const stillOpen = await json(`/api/games/${reportGameId}`);
assert.equal(
  stillOpen.response.status,
  200,
  "A duplicate abuse report closed the invitation.",
);
const thirdReporter = await json(`/api/games/${reportGameId}/report`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-forwarded-for": `${reporterPrefix}::3`,
  },
  body: JSON.stringify({ reason: "harassment" }),
});
assert.equal(
  thirdReporter.body.automaticallyClosed,
  true,
  "Three distinct reporters did not quarantine the invitation.",
);
const privateMetadataPage = await fetch(`${baseUrl}/g/${reportGameId}`);
const privateMetadataHtml = await privateMetadataPage.text();
assert.equal(
  privateMetadataHtml.includes("Metadata must stay private"),
  false,
  "Creator name leaked through page metadata.",
);
assert.equal(
  privateMetadataHtml.includes("Private recipient"),
  false,
  "Recipient name leaked through page metadata.",
);
const reportCleanup = await json(`/api/games/${reportGameId}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${reportAccess.token}` },
});
assert.equal(
  reportCleanup.response.status,
  200,
  JSON.stringify(reportCleanup.body),
);

let exactExpiryCutoff = false;
if (process.env.DATABASE_URL) {
  const expiryAccess = await creatorCredential();
  const expiryGame = await createEncryptedGame(expiryAccess, {
    invitationOverrides: { creatorName: "Expiry verifier" },
  });
  assert.equal(
    expiryGame.response.status,
    201,
    JSON.stringify(expiryGame.body),
  );
  const expiryGameId = expiryGame.body.id;
  const expiryBearer = expiryAccess.token;
  assert.ok(expiryGameId && expiryBearer);
  const expirySubmission = await json(`/api/games/${expiryGameId}/responses`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${expiryGame.submissionToken}`,
    },
    body: JSON.stringify({
      encryptedResponse: envelope,
      answerCount: questions.length,
    }),
  });
  assert.equal(
    expirySubmission.response.status,
    201,
    JSON.stringify(expirySubmission.body),
  );
  const sql = neon(process.env.DATABASE_URL);
  await sql`UPDATE games SET expires_at = ${new Date(Date.now() - 1_000).toISOString()} WHERE id = ${expiryGameId}`;
  const expiredPrivateRead = await json(
    `/api/games/${expiryGameId}/responses`,
    { headers: { authorization: `Bearer ${expiryBearer}` } },
  );
  assert.equal(
    expiredPrivateRead.response.status,
    410,
    "The creator dashboard could read an expired response.",
  );
  const [activeExpiredGame] =
    await sql`SELECT COUNT(*)::int AS count FROM games WHERE id = ${expiryGameId}`;
  const [activeExpiredResponse] =
    await sql`SELECT COUNT(*)::int AS count FROM responses WHERE game_id = ${expiryGameId}`;
  assert.equal(
    activeExpiredGame.count,
    0,
    "Expired invitation was not opportunistically deleted.",
  );
  assert.equal(
    activeExpiredResponse.count,
    0,
    "Expired response remained in the active database.",
  );
  exactExpiryCutoff = true;
}

console.log(
  JSON.stringify({
    ok: true,
    baseUrl,
    invitationAlgorithm: "HKDF-SHA256+A256GCM+A256GCM",
    responseAlgorithm: envelope.alg,
    invitationPlaintextSentToDatabase: false,
    responsePlaintextSentToDatabase: false,
    completeCreatorLinkReturnedByApi: false,
    creationRequiresClientTokenHash: true,
    activeGameAfterConsume: false,
    ciphertextReadableWithUserHeldKeys: true,
    linkOnlyInvitationDecryptsWithCompleteLink: true,
    sharedKeyModeRejectsWrongKey: true,
    newSharedKeyBits: 128,
    sharedKeyAbsentFromServerPayload: true,
    idOnlySubmissionRejected: idOnlySubmission.response.status === 403,
    concurrentSingleUseAccepted: 1,
    recipientSelfDeletion: true,
    duplicateAbuseReportsIgnored: true,
    privateNamesAbsentFromMetadata: true,
    queryStringKeysRejected: true,
    exactExpiryCutoff,
  }),
);
