import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const port = 3123;
let server;

before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { cwd: projectRoot, stdio: "ignore" });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${port}/`);
      if (response.ok) return;
    } catch {
      // The server may still be starting; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Next.js test server did not start.");
});

after(() => server?.kill());

async function render(path = "/") {
  return fetch(`http://localhost:${port}${path}`, { headers: { accept: "text/html" } });
}

test("server-renders the English-first Z4SK product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  assert.doesNotMatch(response.headers.get("content-security-policy") ?? "", /script-src[^;]*'unsafe-inline'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /style-src 'self' 'nonce-[^']+'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /style-src-attr 'none'/);
  assert.doesNotMatch(response.headers.get("content-security-policy") ?? "", /style-src[^;]*'unsafe-inline'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /report-uri \/api\/csp-report/);
  assert.match(response.headers.get("content-security-policy") ?? "", /report-to csp-endpoint/);
  assert.match(response.headers.get("content-security-policy-report-only") ?? "", /require-trusted-types-for 'script'/);
  assert.match(response.headers.get("reporting-endpoints") ?? "", /^csp-endpoint="http:\/\/localhost:3123\/api\/csp-report"$/);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("cross-origin-embedder-policy"), "require-corp");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  const html = await response.text();
  assert.match(html, /<script[^>]+nonce=/);
  assert.match(html, /Z4SK — Ask\. Answer\. Dare\./i);
  assert.match(html, /Some things you only/);
  assert.match(html, /Private answers/);
  assert.match(html, /hero-start/);
  assert.doesNotMatch(html, /class="studio"/);
  assert.match(html, /<html lang="en-US">/);
  assert.match(html, /rel="icon" href="\/favicon\.ico"/);
  assert.match(html, /rel="shortcut icon" href="\/favicon\.ico"/);
  assert.match(html, /value="machine"/);
  assert.match(html, /value="ja"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="hi"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("hardens the undocumented API root", async () => {
  const response = await fetch(`http://localhost:${port}/api`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/i);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-security-policy"), "default-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  assert.equal(response.headers.get("x-powered-by"), null);
});

test("collects only privacy-preserving CSP aggregates", async () => {
  const [route, headers, migrations, proof] = await Promise.all([
    readFile(new URL("../app/api/csp-report/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/security-headers.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/migrations.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/api/privacy-proof/route.ts", import.meta.url), "utf8"),
  ]);
  const invalid = await fetch(`http://localhost:${port}/api/csp-report`, { method: "POST", headers: { "content-type": "application/csp-report" }, body: "not-json" });
  assert.equal(invalid.status, 204);
  assert.equal(invalid.headers.get("cache-control"), "no-store");
  assert.match(headers, /require-trusted-types-for 'script'/);
  assert.match(headers, /report-uri \$\{CSP_REPORT_ENDPOINT\}/);
  assert.match(route, /MAX_BODY_BYTES = 32_768/);
  assert.match(route, /MAX_REPORTS_PER_REQUEST = 10/);
  assert.match(route, /return "\/g\/:id"/);
  assert.match(route, /Do not log their payload, URL, source or parse error/);
  assert.doesNotMatch(route, /console\.(?:log|error|warn)/);
  assert.match(migrations, /CREATE TABLE IF NOT EXISTS csp_violation_daily/);
  assert.doesNotMatch(migrations, /csp_violation_daily[^`]*(?:document_uri|blocked_uri|source_file|sample|ip|user_id|game_id)/i);
  assert.match(proof, /securityTelemetry/);
  assert.match(proof, /VERCEL_GIT_COMMIT_SHA/);
});

test("ships privacy, defensibility and PWA assets", async () => {
  const [builder, qrCard, gameClient, dashboardClient, shareInvitation, shareCss, home, privacyProofUi, pwa, questions, gameRoute, sdk, consume, responseRoute, reportRoute, metricsRoute, proofRoute, privacyEngine, runtime, responseCrypto, encryptionTypes, vercel, assetRegister, manifest, sw, og, favicon, icon192, icon512, nameCopy] = await Promise.all([
    readFile(new URL("../app/components/Builder.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/QrCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/g/[id]/GameClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/p/[id]/DashboardClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ShareInvitation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/share.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/HomeContent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/PrivacyProof.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwaRegister.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/questions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../packages/z4sk-sdk/src/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/consume/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/responses/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/report/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/founder/metrics/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/privacy-proof/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/privacy.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/runtime.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/response-crypto.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/encryption-types.ts", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
    readFile(new URL("../SELLABLE_ASSETS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    stat(new URL("../public/og.png", import.meta.url)),
    stat(new URL("../public/favicon-32.png", import.meta.url)),
    stat(new URL("../public/icon-192.png", import.meta.url)),
    stat(new URL("../public/icon-512.png", import.meta.url)),
    readFile(new URL("../app/lib/name-copy.ts", import.meta.url), "utf8"),
  ]);
  const [brand, faviconIco, founderAuth, founderAds, publicAds, founderDashboard, cancellationCopy, cancellationClient, migrations, workflow, invitationCrypto, auditPage, cryptographyDoc, securityDoc] = await Promise.all([
    readFile(new URL("../app/components/Brand.tsx", import.meta.url), "utf8"),
    stat(new URL("../public/favicon.ico", import.meta.url)),
    readFile(new URL("../app/lib/founder-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/founder/ads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/ads/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/founder/FounderDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/cancellation-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/cancel/[id]/CancelResponseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/migrations.mjs", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/invitation-crypto.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/audit/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/CRYPTOGRAPHY.md", import.meta.url), "utf8"),
    readFile(new URL("../SECURITY.md", import.meta.url), "utf8"),
  ]);
  assert.match(builder, /Share once & remove ads/);
  assert.doesNotMatch(`${builder}\n${gameClient}\n${founderDashboard}`, /\sstyle=\{/);
  assert.match(builder, /<progress className="steps-line"/);
  assert.match(gameClient, /<progress className="question-progress"/);
  assert.match(founderDashboard, /<DailyChart rows=\{data\.daily\}/);
  assert.match(builder, /<a href=\{created\.adminUrl\} target="_blank" rel="noopener noreferrer">\{t\("openPanel"\)\}<\/a>/);
  assert.match(builder, /Secret match/);
  assert.match(builder, /YOUR SECRET MATCH QUESTION/);
  assert.match(builder, /matchQuestion/);
  assert.match(builder, /id="match-question"/);
  assert.match(builder, /maxLength=\{180\}/);
  assert.match(builder, /You answer first/);
  assert.match(builder, /30-second challenge/);
  assert.match(builder, /must confirm it twice before starting/);
  assert.match(builder, /timedMode/);
  assert.match(builder, /Several people can answer with the same link/);
  assert.match(builder, /Varias personas pueden responder con el mismo enlace/);
  assert.match(builder, /deleted from the active database/);
  assert.match(builder, /¿CUÁNDO DESAPARECE\?/);
  assert.doesNotMatch(builder, /PACK PATROCINADO/);
  assert.match(builder, /SMART MIX/);
  assert.match(builder, /creatorEmail/);
  assert.match(builder, /YOUR EMAIL · OPTIONAL/);
  assert.match(builder, /Z4SK never receives or stores it/);
  assert.match(builder, /<QrCard kind="invitation"/);
  assert.match(builder, /<QrCard kind="dashboard"/);
  assert.match(builder, /generateResponseKeyPair/);
  assert.match(builder, /generateCreatorAccessCredential/);
  assert.match(builder, /creatorTokenHash: access\.tokenHash/);
  assert.match(builder, /window\.location\.origin.*#key=/);
  assert.match(builder, /attachPrivateDecryptionKey/);
  assert.match(builder, /generateInvitationSecret/);
  assert.match(builder, /encryptPrivateInvitation/);
  assert.match(builder, /attachInvitationSecret/);
  assert.match(builder, /encryptedInvitation/);
  assert.match(builder, /encryptionPublicKey: encryptionKeys\.publicKey/);
  assert.match(builder, /creatorName\.trim\(\)\.length >= 1 && recipientName\.trim\(\)\.length >= 1/);
  assert.match(builder, /id="creator" required minLength=\{1\} maxLength=\{40\}/);
  assert.match(builder, /id="recipient" required minLength=\{1\} maxLength=\{40\}/);
  assert.match(builder, /normalizedCreatorName/);
  assert.match(builder, /normalizedRecipientName/);
  assert.match(gameRoute, /isEncryptedInvitationEnvelope/);
  assert.doesNotMatch(gameRoute, /body\.(?:creatorName|recipientName|questions|encryptionPublicKey|matchQuestion)/);
  for (const locale of ["en", "es", "it", "fr", "de", "nl", "eo", "pt", "zh", "hi", "ja", "tr", "machine"]) assert.match(nameCopy, new RegExp(`\\b${locale}:`));
  assert.doesNotMatch(gameRoute, /body\.creatorEmail/);
  assert.doesNotMatch(gameRoute, /body\.creatorInterest/);
  assert.doesNotMatch(sdk, /creatorEmail/);
  assert.match(sdk, /ECDH/);
  assert.match(sdk, /AES-GCM/);
  assert.match(sdk, /attachInvitation\(created\.playUrl,secret\)/);
  assert.match(gameRoute, /encryption_public_key/);
  assert.match(gameRoute, /encrypted_invitation/);
  assert.match(gameRoute, /question_count/);
  assert.match(gameRoute, /creatorTokenHash/);
  assert.doesNotMatch(gameRoute, /creatorToken\s*=|adminUrl:/);
  assert.match(gameRoute, /match_question/);
  assert.match(qrCard, /import\("qrcode"\)/);
  assert.match(qrCard, /QRCode\.toCanvas/);
  assert.match(qrCard, /ctx\.textAlign="center".*drawWrapped\(ctx,title,540,278,880,72,3\).*ctx\.textAlign="left"/);
  assert.match(qrCard, /"image\/png"\|"image\/jpeg"/);
  assert.match(qrCard, /SECRET · DO NOT SHARE/);
  assert.match(qrCard, /generation=device_local/);
  assert.match(qrCard, /qr\.contains=ONLY_PRIVATE_DECRYPTION_KEY/);
  assert.match(gameClient, /setRespondentName\(decryptedGame\.recipientName\)/);
  assert.match(gameClient, /hydrateGameWire/);
  assert.match(gameClient, /encryptPrivateResponse/);
  assert.match(gameClient, /verifyEncryptionPublicKeyFingerprint/);
  assert.match(gameClient, /window\.history\.replaceState\(\{\},"",cancelUrl\)/);
  assert.match(gameClient, /useRef<HTMLTextAreaElement>/);
  assert.match(gameClient, /emojiSets\[game\.level\]/);
  assert.match(gameClient, /selectionStart/);
  assert.match(gameClient, /setSelectionRange\(cursor,cursor\)/);
  assert.match(gameClient, /INSERT_EMOJI_AT_CURSOR/);
  assert.match(gameClient, /game\.matchQuestion\.trim\(\)/);
  assert.match(gameClient, /timed-confirm-one/);
  assert.match(gameClient, /timed-confirm-two/);
  assert.match(gameClient, /deadline=Date\.now\(\)\+30_000/);
  assert.match(gameClient, /useEffectEvent/);
  assert.match(gameClient, /handleQuestionTimeout\(\)/);
  assert.match(gameClient, /navigation\.back=false/);
  assert.match(gameClient, /respondentName\.trim\(\)\.length < 1/);
  assert.match(gameClient, /id="respondent" required minLength=\{1\} maxLength=\{40\}/);
  assert.match(gameClient, /respondentName:respondentName\.trim\(\)\.replace/);
  assert.doesNotMatch(gameClient, /JSON\.stringify\(\{ respondentName, answers, reactions, matchInterest \}\)/);
  assert.match(dashboardClient, /role="alertdialog"/);
  assert.match(dashboardClient, /aria-modal="true"/);
  assert.doesNotMatch(dashboardClient, /confirm\(flow\(locale, "confirmReveal"\)\)/);
  assert.match(dashboardClient, /styles\.backHomeLink/);
  assert.match(dashboardClient, /aria-hidden="true">←/);
  assert.match(dashboardClient, /<a className=\{styles\.backHomeLink\} href="\/" target="_top">/);
  assert.match(dashboardClient, /decryptPrivateResponse/);
  assert.match(dashboardClient, /verifyPrivateDecryptionKey/);
  assert.match(dashboardClient, /matchQuestion=\{data\.game\.matchQuestion\}/);
  assert.match(dashboardClient, /history\.replaceState\(\{\}, "", `\/p\/\$\{id\}`\)/);
  assert.match(dashboardClient, /setPrivateKey\(""\)/);
  assert.match(brand, /<a className="brand" href="\/" target="_top" aria-label=\{navCopy\[locale\]\.home\}>/);
  assert.doesNotMatch(brand, /<Link className="brand"/);
  assert.ok((home.match(/target="_top"/g)?.length || 0) >= 4);
  assert.match(shareInvitation, /https:\/\/wa\.me/);
  assert.match(shareInvitation, /mailto:\?subject/);
  assert.match(shareInvitation, /https:\/\/mail\.google\.com\/mail\/\?view=cm/);
  assert.match(shareInvitation, /https:\/\/outlook\.office\.com\/mail\/deeplink\/compose\?/);
  assert.match(shareInvitation, /https:\/\/compose\.mail\.yahoo\.com\/\?subject=/);
  assert.match(shareInvitation, /navigator\.share/);
  assert.match(shareInvitation, /adminUrl=REDACTED/);
  assert.match(shareInvitation, /Treat this link like a password/);
  assert.match(shareInvitation, /Compartir este enlace es como compartir una contraseña/);
  assert.match(shareCss, /@media\(max-width:620px\)/);
  assert.match(shareCss, /\.share-webmail\{display:none\}/);
  assert.match(home, /role="dialog"/);
  assert.match(home, /builderOpen/);
  assert.match(home, /privacy\?lang=\$\{locale\}/);
  assert.match(home, /terms\?lang=\$\{locale\}/);
  assert.match(home, /safety\?lang=\$\{locale\}/);
  assert.match(home, /href="\/audit"/);
  assert.ok(home.includes("github.com/josejnet/z4sk"));
  assert.match(privacyProofUi, /target="_blank"/);
  assert.match(privacyProofUi, /rel="noopener noreferrer"/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /appinstalled/);
  assert.match(pwa, /Add to Home Screen/);
  assert.match(pwa, /安装 Z4SK/);
  assert.match(pwa, /Z4SK इंस्टॉल करें/);
  assert.match(questions, /你对我的第一印象是什么/);
  assert.match(questions, /मेरे बारे में आपकी पहली राय क्या थी/);
  const noFilterBanks = [...questions.matchAll(/sinfiltro:\s*\[(.*?)\]/gs)].map((match) => match[1].match(/"(?:[^"\\]|\\.)*"/g) ?? []).filter((bank) => bank.length > 2);
  assert.equal(noFilterBanks.length, 13);
  for (const bank of noFilterBanks) { assert.equal(bank.length, 10); assert.equal(new Set(bank).size, 10); }
  assert.match(questions, /¿Te gustaría tener sexo oral conmigo\?/);
  assert.match(questions, /mutual_consent=true/);
  assert.doesNotMatch(questions, /¿Qué fantasía nunca le has contado a nadie\?/);
  assert.doesNotMatch(questions, /¿Cuál ha sido tu pensamiento más atrevido sobre mí\?/);
  assert.doesNotMatch(questions, /¿Qué es lo más provocador que alguien puede decirte\?/);
  assert.doesNotMatch(questions, /¿Prefieres tener el control o que te sorprendan\?/);
  assert.doesNotMatch(questions, /¿Cuál es tu mayor debilidad cuando alguien te atrae\?/);
  assert.match(invitationCrypto, /"zh", "hi"/);
  assert.match(sdk, /"zh"\|"hi"/);
  assert.match(sdk, /timedMode\?:boolean/);
  assert.match(sdk, /matchQuestion\?:string/);
  assert.match(builder, /expiresInHours/);
  assert.match(consume, /eligible_game AS MATERIALIZED/);
  assert.match(consume, /FOR UPDATE OF response/);
  assert.match(consume, /DELETE FROM games/);
  assert.match(consume, /scrubbed_events/);
  assert.match(consume, /CROSS JOIN deleted_game/);
  assert.match(consume, /no-store, no-cache/);
  assert.match(responseRoute, /trend_metrics/);
  assert.match(responseRoute, /encrypted_payload/);
  assert.doesNotMatch(responseRoute, /body\.(?:respondentName|answers|reactions|matchInterest)/);
  assert.doesNotMatch(responseRoute, /eventType:\s*"matched"/);
  assert.match(responseRoute, /checkRateLimit/);
  assert.match(responseRoute, /delete_token_hash/);
  assert.match(responseRoute, /export async function DELETE/);
  assert.match(migrations, /ux_responses_single_use_game/);
  assert.match(migrations, /ux_abuse_reports_game_reporter/);
  assert.match(runtime, /hashRateLimitIdentifier/);
  assert.doesNotMatch(runtime, /CREATE TABLE|ALTER TABLE|CREATE INDEX/);
  assert.doesNotMatch(runtime, /searchParams\.get\("key"\)/);
  assert.match(reportRoute, /automaticallyClosed/);
  assert.match(reportRoute, /COUNT\(DISTINCT reporter_hash\)/);
  assert.match(reportRoute, /duplicate:!inserted\.meta\.changes/);
  assert.match(reportRoute, /reported/);
  assert.match(founderAuth, /FOUNDER_DASHBOARD_KEY/);
  assert.match(founderAuth, /founder-dashboard/);
  assert.match(founderAuth, /expected\.length < 32/);
  assert.match(metricsRoute, /Aggregate metrics only/);
  assert.match(metricsRoute, /timed_mode/);
  assert.match(founderAuth, /authorization/);
  assert.match(metricsRoute, /sponsor_config/);
  assert.match(metricsRoute, /sponsor_events/);
  assert.match(metricsRoute, /adStats/);
  assert.match(founderAds, /authorizeFounder/);
  assert.match(founderAds, /parsed\.protocol !== "https:"/);
  assert.match(publicAds, /enabled: false/);
  assert.match(publicAds, /export async function POST/);
  assert.match(publicAds, /event_count=sponsor_events\.event_count\+1/);
  assert.match(publicAds, /checkRateLimit\(request, `sponsor-\$\{eventType\}:\$\{campaignVersion\}:\$\{placement\}`/);
  assert.match(responseRoute, /declaredLength > 50_000/);
  assert.match(responseRoute, /count \|\| 0\) >= 100/);
  assert.match(founderDashboard, /Sponsor placement/);
  assert.match(founderDashboard, /Sponsor performance/);
  assert.match(founderDashboard, /Viewable impressions/);
  assert.match(founderDashboard, /no user or invitation identifier/i);
  assert.match(brand, /rel="noopener noreferrer sponsored nofollow"/);
  assert.match(brand, /IntersectionObserver/);
  assert.match(brand, /intersectionRatio<0\.5/);
  assert.match(brand, /sessionStorage\.getItem/);
  assert.match(brand, /recordSponsorClick/);
  assert.match(migrations, /CREATE TABLE IF NOT EXISTS sponsor_events/);
  assert.doesNotMatch(migrations, /sponsor_events[^`]*(?:user_id|device_id|game_id)/);
  assert.match(proofRoute, /live runtime self-audit/);
  assert.match(proofRoute, /const POLICY_VERSION = "2026\.11\.02-privacy\.8"/);
  assert.match(proofRoute, /policyVersion: POLICY_VERSION/);
  assert.match(proofRoute, /"x-z4sk-privacy-proof": POLICY_VERSION/);
  assert.match(proofRoute, /Creator email never reaches the active database/);
  assert.match(proofRoute, /Invitation and response decryption keys never enter the database/);
  assert.match(proofRoute, /New invitation names, questions and settings are authenticated ciphertext only/);
  assert.match(proofRoute, /Every active response is authenticated ciphertext only/);
  assert.match(proofRoute, /TECHNICAL CONTROLS PASS|technicalOverall/);
  assert.match(proofRoute, /Database tables are not readable by the Postgres PUBLIC role/);
  assert.match(proofRoute, /Founder access uses a strong server-only secret/);
  assert.doesNotMatch(proofRoute, /id: "expiry-games"[^}]*pass: true/);
  assert.match(gameRoute, /randomToken\(16\)/);
  assert.match(runtime, /hashMetricIdentifier/);
  assert.match(privacyEngine, /metric:/);
  assert.match(migrations, /timed_mode INTEGER NOT NULL DEFAULT 0/);
  assert.match(migrations, /match_question TEXT NOT NULL DEFAULT ''/);
  assert.match(migrations, /UPDATE games SET creator_email = ''/);
  assert.match(migrations, /DELETE FROM responses WHERE game_id IN/);
  assert.match(migrations, /encrypted_payload = ''/);
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.equal((workflow.match(/runs-on: ubuntu-24\.04/g) || []).length, 2);
  assert.match(workflow, /npm run verify:e2e:staging/);
  assert.match(workflow, /Z4SK_PRODUCTION_MIGRATION_DATABASE_URL/);
  assert.match(workflow, /VERCEL_DEPLOY_HOOK_URL/);
  assert.match(responseCrypto, /ECDH/);
  assert.match(responseCrypto, /AES-GCM/);
  assert.match(responseCrypto, /HKDF/);
  assert.match(responseCrypto, /shared\.fill\(0\)/);
  assert.match(responseCrypto, /private decryption key does not match this invitation/);
  assert.match(responseCrypto, /generateCreatorAccessCredential/);
  assert.match(responseCrypto, /fingerprintEncryptionPublicKey/);
  assert.match(responseCrypto, /The invitation encryption key has changed/);
  assert.match(responseCrypto, /payload\.respondentName\.trim\(\)\.length < 1/);
  assert.match(encryptionTypes, /ECDH-P256\+HKDF-SHA256\+A256GCM/);
  assert.match(encryptionTypes, /A256GCM/);
  assert.match(invitationCrypto, /z4sk-invitation-v1/);
  assert.match(invitationCrypto, /generateInvitationSecret/);
  assert.match(invitationCrypto, /AES-GCM/);
  assert.match(invitationCrypto, /plaintext\.fill\(0\)/);
  assert.match(auditPage, /THE INVITATION LINK IS A PASSWORD-EQUIVALENT SECRET/);
  assert.ok(auditPage.includes("github.com/josejnet/z4sk"));
  assert.match(auditPage, /docs\/EXTERNAL_AUDIT\.md/);
  assert.match(auditPage, /docs\/EXTERNAL_AUDIT\.es\.md/);
  assert.match(auditPage, /docs\/HUMAN_SECURITY_REVIEW\.md/);
  assert.match(auditPage, /PrivacyProof/);
  assert.match(cryptographyDoc, /Sharing the complete invitation link is equivalent to sharing a password/);
  assert.match(cryptographyDoc, /Server-visible data/);
  assert.match(securityDoc, /GitHub private vulnerability reporting/);
  assert.match(migrations, /encrypted_invitation TEXT NOT NULL DEFAULT ''/);
  assert.match(migrations, /question_count INTEGER NOT NULL DEFAULT 0/);
  assert.match(proofRoute, /No expired answers remain in the active database/);
  assert.match(privacyEngine, /purgeExpiredData/);
  assert.match(privacyEngine, /DELETE FROM responses WHERE game_id IN/);
  assert.match(vercel, /"schedule": "0 3 \* \* \*"/);
  assert.match(builder, /hash\.slice\(1\)/);
  assert.doesNotMatch(builder, /localStorage/);
  assert.match(manifest, /"display":"standalone"/);
  assert.match(manifest, /"scope":"\/"/);
  assert.match(manifest, /"orientation":"portrait-primary"/);
  assert.match(sw, /showNotification/);
  assert.match(manifest, /"src":"\/icon-192\.png"/);
  assert.match(manifest, /"src":"\/icon-512\.png"/);
  assert.match(sw, /z4sk-shell-v4/);
  assert.match(sw, /\/favicon\.ico/);
  for (const locale of ["en", "es", "it", "fr", "de", "nl", "eo", "pt", "zh", "hi", "ja", "tr", "machine"]) assert.match(cancellationCopy, new RegExp(`\\b${locale}:`));
  assert.match(cancellationClient, /authorization:\s*`Bearer \$\{credential\.deletionToken\}`/);
  assert.match(cancellationClient, /history\.replaceState\(\{\}, "", `\/cancel\/\$\{id\}`\)/);
  assert.match(assetRegister, /Smart Mix™/);
  assert.match(assetRegister, /chain-of-title/);
  assert.ok(og.size > 100_000);
  assert.ok(favicon.size > 1_000);
  assert.ok(faviconIco.size > 1_000);
  assert.ok(icon192.size > 10_000);
  assert.ok(icon512.size > 50_000);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("publishes plain-language privacy, audit and safety pages", async () => {
  const [privacy, audit, safety, terms] = await Promise.all([render("/privacy"), render("/audit"), render("/safety"), render("/terms")]);
  const legalPage = await readFile(new URL("../app/components/LegalPage.tsx", import.meta.url), "utf8");
  assert.equal(privacy.status, 200); const privacyHtml = await privacy.text(); assert.match(privacyHtml, /Private by design/); assert.match(privacyHtml, /end-to-end encrypted/); assert.match(privacyHtml, /Neon Postgres/); assert.match(privacyHtml, /What the founder can see/); assert.match(privacyHtml, /audited access matrix/); assert.match(privacyHtml, /password/); assert.match(privacyHtml, /processed transiently/); assert.match(privacyHtml, /private cancellation link/); assert.match(privacyHtml, /us-east-1/);
  assert.equal(audit.status, 200); const auditHtml = await audit.text(); assert.match(auditHtml, /Don&#x27;t just trust us/); assert.match(auditHtml, /PASSWORD-EQUIVALENT SECRET/); assert.match(auditHtml, /Compartir el enlace completo es como compartir una contraseña/); assert.match(auditHtml, /Inspect source code/); assert.match(auditHtml, /Open JSON evidence/);
  assert.equal(safety.status, 200); assert.match(await safety.text(), /Protect creator access/);
  assert.equal(terms.status, 200); assert.match(await terms.text(), /Payments are disabled/);
  assert.doesNotMatch(legalPage, /next\/link|<Link/);
  assert.match(legalPage, /privacy\?lang=\$\{locale\}/);
  assert.match(legalPage, /terms\?lang=\$\{locale\}/);
  assert.match(legalPage, /safety\?lang=\$\{locale\}/);
  assert.match(legalPage, /DATE_LOCALES/);
  assert.match(legalPage, /Intl\.DateTimeFormat/);
  assert.match(legalPage, /document\.title=/);
  assert.match(legalPage, /JSON · \{doc\.eyebrow\}/);
});

test("requires complete translations and hard navigation for every supported locale", async () => {
  const [i18n, flowCopy, legalCopy, builder, game, pwa, htmlInvite, brand, dashboard] = await Promise.all([
    readFile(new URL("../app/lib/i18n.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/flow-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/legal-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Builder.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/g/[id]/GameClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwaRegister.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/html-invite.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Brand.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/p/[id]/DashboardClient.tsx", import.meta.url), "utf8"),
  ]);
  const locales = ["en","es","it","fr","de","nl","eo","pt","zh","hi","ja","tr","machine"];
  assert.equal((i18n.match(/id:/g) ?? []).length >= locales.length, true);
  assert.doesNotMatch(i18n, /const (?:nl|eo|pt|ja|tr|machine):typeof en=\{\.\.\.en/);
  assert.doesNotMatch(flowCopy, /\{\.\.\.FLOW_COPY\.en/);
  assert.match(i18n, /Missing translation:/);
  assert.match(flowCopy, /Missing flow translation:/);
  assert.match(legalCopy, /Record<Locale,LegalLocale>/);
  assert.match(legalCopy, /const OWNER_BLINDNESS_COPY:Record<Locale/);
  assert.doesNotMatch(legalCopy, /Z4SK minimiza los datos de la invitación/);
  assert.doesNotMatch(legalCopy, /no se garantiza el borrado físico en 24 horas/);
  assert.doesNotMatch(legalCopy, /Vercel y Neon procesan metadatos operativos en infraestructura estadounidense/);
  for (const locale of locales) assert.match(legalCopy, new RegExp(`(?:^|\\s)${locale}:\\{`));
  for (const locale of locales) assert.match(legalCopy, new RegExp(`${locale}:\\{access:`));
  for (const source of [builder, game]) assert.match(source, /Record<Locale,T>/);
  for (const source of [pwa, htmlInvite, dashboard]) assert.match(source, /Record<Locale,/);
  assert.doesNotMatch(builder + game + pwa + htmlInvite, /new Proxy/);
  assert.doesNotMatch(game, /from "next\/link"|<Link/);
  assert.match(game, /target="_top"/);
  assert.match(brand, /target="_top"/);
  assert.match(dashboard, /target="_top"/);
  assert.match(i18n, /localStorage\.setItem\("z4sk-locale"/);
});
