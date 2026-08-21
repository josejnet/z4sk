import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html", host: "localhost" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the English-first Z4SK product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Z4SK — Ask\. Answer\. Dare\./i);
  assert.match(html, /Some things you only/);
  assert.match(html, /Private answers/);
  assert.match(html, /hero-start/);
  assert.doesNotMatch(html, /class="studio"/);
  assert.match(html, /<html lang="en-US">/);
  assert.match(html, /value="machine"/);
  assert.match(html, /value="ja"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships privacy, defensibility and PWA assets", async () => {
  const [builder, home, pwa, consume, responseRoute, reportRoute, metricsRoute, proofRoute, privacyEngine, wrangler, assetRegister, manifest, sw, og] = await Promise.all([
    readFile(new URL("../app/components/Builder.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/HomeContent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PwaRegister.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/consume/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/responses/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/report/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/founder/metrics/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/privacy-proof/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/privacy.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../SELLABLE_ASSETS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    stat(new URL("../public/og.png", import.meta.url)),
  ]);
  assert.match(builder, /Share once & remove ads/);
  assert.match(builder, /Double Blind Match/);
  assert.match(builder, /SMART MIX/);
  assert.match(builder, /creatorEmail/);
  assert.match(builder, /Email my unique access link/);
  assert.match(home, /role="dialog"/);
  assert.match(home, /builderOpen/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /appinstalled/);
  assert.match(pwa, /Add to Home Screen/);
  assert.match(builder, /expiresInHours/);
  assert.match(consume, /deleteGameData/);
  assert.match(consume, /no-store, no-cache/);
  assert.match(responseRoute, /trend_metrics/);
  assert.match(responseRoute, /matched/);
  assert.match(responseRoute, /checkRateLimit/);
  assert.match(reportRoute, /automaticallyClosed/);
  assert.match(reportRoute, /reported/);
  assert.match(metricsRoute, /FOUNDER_DASHBOARD_KEY/);
  assert.match(metricsRoute, /Aggregate metrics only/);
  assert.match(metricsRoute, /authorization/);
  assert.match(proofRoute, /live runtime self-audit/);
  assert.match(proofRoute, /No expired answers remain in active D1/);
  assert.match(privacyEngine, /purgeExpiredData/);
  assert.match(privacyEngine, /DELETE FROM responses WHERE game_id IN/);
  assert.match(wrangler, /"crons": \["\* \* \* \* \*"\]/);
  assert.match(builder, /hash\.slice\(1\)/);
  assert.doesNotMatch(builder, /localStorage/);
  assert.match(manifest, /"display":"standalone"/);
  assert.match(manifest, /"scope":"\/"/);
  assert.match(manifest, /"orientation":"portrait-primary"/);
  assert.match(sw, /showNotification/);
  assert.match(sw, /z4sk-shell-v2/);
  assert.match(assetRegister, /Smart Mix™/);
  assert.match(assetRegister, /chain-of-title/);
  assert.ok(og.size > 100_000);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("publishes plain-language privacy and safety pages", async () => {
  const [privacy, safety, terms] = await Promise.all([render("/privacy"), render("/safety"), render("/terms")]);
  assert.equal(privacy.status, 200); const privacyHtml = await privacy.text(); assert.match(privacyHtml, /Private by design/); assert.match(privacyHtml, /Cloudflare D1 Time Travel/); assert.match(privacyHtml, /What the founder can see/);
  assert.equal(safety.status, 200); assert.match(await safety.text(), /Protect creator access/);
  assert.equal(terms.status, 200); assert.match(await terms.text(), /Payments are disabled/);
});
