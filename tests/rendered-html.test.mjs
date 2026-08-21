import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html", host: "localhost" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the English-first Pásalo product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Pásalo — Ask\. Answer\. Dare\./i);
  assert.match(html, /Some things you only/);
  assert.match(html, /Private answers/);
  assert.match(html, /<html lang="en-US">/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships privacy, defensibility and PWA assets", async () => {
  const [builder, consume, responseRoute, reportRoute, metricsRoute, assetRegister, manifest, sw, og] = await Promise.all([
    readFile(new URL("../app/components/Builder.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/consume/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/responses/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/games/[id]/report/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/founder/metrics/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../SELLABLE_ASSETS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    stat(new URL("../public/og.png", import.meta.url)),
  ]);
  assert.match(builder, /Share once & remove ads/);
  assert.match(builder, /Double Blind Match/);
  assert.match(builder, /SMART MIX/);
  assert.match(builder, /expiresInHours/);
  assert.match(consume, /DELETE FROM responses/);
  assert.match(consume, /no-store, no-cache/);
  assert.match(responseRoute, /trend_metrics/);
  assert.match(responseRoute, /matched/);
  assert.match(responseRoute, /checkRateLimit/);
  assert.match(reportRoute, /automaticallyClosed/);
  assert.match(reportRoute, /reported/);
  assert.match(metricsRoute, /FOUNDER_DASHBOARD_KEY/);
  assert.match(metricsRoute, /Aggregate metrics only/);
  assert.match(manifest, /"display":"standalone"/);
  assert.match(sw, /showNotification/);
  assert.match(assetRegister, /Smart Mix™/);
  assert.match(assetRegister, /chain-of-title/);
  assert.ok(og.size > 100_000);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("publishes plain-language privacy and safety pages", async () => {
  const [privacy, safety, terms] = await Promise.all([render("/privacy"), render("/safety"), render("/terms")]);
  assert.equal(privacy.status, 200); assert.match(await privacy.text(), /We do not place answer text in analytics/);
  assert.equal(safety.status, 200); assert.match(await safety.text(), /Report an invitation/);
  assert.equal(terms.status, 200); assert.match(await terms.text(), /payment feature is not active/);
});
