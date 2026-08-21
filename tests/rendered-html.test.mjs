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
  assert.match(html, /rel="icon" href="\/favicon\.ico"/);
  assert.match(html, /rel="shortcut icon" href="\/favicon\.ico"/);
  assert.match(html, /value="machine"/);
  assert.match(html, /value="ja"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="hi"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships privacy, defensibility and PWA assets", async () => {
  const [builder, gameClient, dashboardClient, shareInvitation, shareCss, home, privacyProofUi, pwa, questions, gameRoute, sdk, consume, responseRoute, reportRoute, metricsRoute, proofRoute, privacyEngine, wrangler, assetRegister, manifest, sw, og, favicon, icon192, icon512] = await Promise.all([
    readFile(new URL("../app/components/Builder.tsx", import.meta.url), "utf8"),
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
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../SELLABLE_ASSETS.md", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    stat(new URL("../public/og.png", import.meta.url)),
    stat(new URL("../public/favicon-32.png", import.meta.url)),
    stat(new URL("../public/icon-192.png", import.meta.url)),
    stat(new URL("../public/icon-512.png", import.meta.url)),
  ]);
  const [brand, faviconIco] = await Promise.all([
    readFile(new URL("../app/components/Brand.tsx", import.meta.url), "utf8"),
    stat(new URL("../public/favicon.ico", import.meta.url)),
  ]);
  assert.match(builder, /Share once & remove ads/);
  assert.match(builder, /Secret match/);
  assert.match(builder, /You answer first/);
  assert.match(builder, /Several people can answer with the same link/);
  assert.match(builder, /Varias personas pueden responder con el mismo enlace/);
  assert.match(builder, /deleted from the active database/);
  assert.match(builder, /¿CUÁNDO DESAPARECE\?/);
  assert.doesNotMatch(builder, /PACK PATROCINADO/);
  assert.match(builder, /SMART MIX/);
  assert.match(builder, /creatorEmail/);
  assert.match(builder, /Email my unique access link/);
  assert.match(gameClient, /setRespondentName\(data\.recipientName\)/);
  assert.match(dashboardClient, /role="alertdialog"/);
  assert.match(dashboardClient, /aria-modal="true"/);
  assert.doesNotMatch(dashboardClient, /confirm\(flow\(locale, "confirmReveal"\)\)/);
  assert.match(dashboardClient, /styles\.backHomeLink/);
  assert.match(dashboardClient, /aria-hidden="true">←/);
  assert.match(dashboardClient, /<a className=\{styles\.backHomeLink\} href="\/" target="_top">/);
  assert.match(brand, /<a className="brand" href="\/" target="_top" aria-label=\{navCopy\[locale\]\.home\}>/);
  assert.doesNotMatch(brand, /<Link className="brand"/);
  assert.equal(home.match(/target="_top"/g)?.length, 3);
  assert.match(shareInvitation, /https:\/\/wa\.me/);
  assert.match(shareInvitation, /mailto:\?subject/);
  assert.match(shareInvitation, /mail\.google\.com/);
  assert.match(shareInvitation, /outlook\.office\.com/);
  assert.match(shareInvitation, /compose\.mail\.yahoo\.com/);
  assert.match(shareInvitation, /navigator\.share/);
  assert.match(shareInvitation, /adminUrl=REDACTED/);
  assert.match(shareCss, /@media\(max-width:620px\)/);
  assert.match(shareCss, /\.share-webmail\{display:none\}/);
  assert.match(home, /role="dialog"/);
  assert.match(home, /builderOpen/);
  assert.match(home, /<a href="\/privacy" target="_top">\{footerCopy\[locale\]\.privacy\}<\/a>/);
  assert.match(home, /<a href="\/terms" target="_top">\{footerCopy\[locale\]\.terms\}<\/a>/);
  assert.match(home, /<a href="\/safety" target="_top">\{footerCopy\[locale\]\.safety\}<\/a>/);
  assert.match(privacyProofUi, /target="_blank"/);
  assert.match(privacyProofUi, /rel="noopener noreferrer"/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /appinstalled/);
  assert.match(pwa, /Add to Home Screen/);
  assert.match(pwa, /安装 Z4SK/);
  assert.match(pwa, /Z4SK इंस्टॉल करें/);
  assert.match(questions, /你对我的第一印象是什么/);
  assert.match(questions, /मेरे बारे में आपकी पहली राय क्या थी/);
  assert.match(gameRoute, /"zh", "hi"/);
  assert.match(sdk, /"zh"\|"hi"/);
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
  assert.match(manifest, /"src":"\/icon-192\.png"/);
  assert.match(manifest, /"src":"\/icon-512\.png"/);
  assert.match(sw, /z4sk-shell-v4/);
  assert.match(sw, /\/favicon\.ico/);
  assert.match(assetRegister, /Smart Mix™/);
  assert.match(assetRegister, /chain-of-title/);
  assert.ok(og.size > 100_000);
  assert.ok(favicon.size > 1_000);
  assert.ok(faviconIco.size > 1_000);
  assert.ok(icon192.size > 10_000);
  assert.ok(icon512.size > 50_000);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("publishes plain-language privacy and safety pages", async () => {
  const [privacy, safety, terms] = await Promise.all([render("/privacy"), render("/safety"), render("/terms")]);
  const legalPage = await readFile(new URL("../app/components/LegalPage.tsx", import.meta.url), "utf8");
  assert.equal(privacy.status, 200); const privacyHtml = await privacy.text(); assert.match(privacyHtml, /Private by design/); assert.match(privacyHtml, /Cloudflare D1 Time Travel/); assert.match(privacyHtml, /What the founder can see/);
  assert.equal(safety.status, 200); assert.match(await safety.text(), /Protect creator access/);
  assert.equal(terms.status, 200); assert.match(await terms.text(), /Payments are disabled/);
  assert.doesNotMatch(legalPage, /next\/link|<Link/);
  assert.match(legalPage, /<a href="\/privacy" target="_top">Privacy<\/a>/);
  assert.match(legalPage, /<a href="\/terms" target="_top">Terms<\/a>/);
  assert.match(legalPage, /<a href="\/safety" target="_top">Safety<\/a>/);
});

test("requires complete translations and hard navigation for every supported locale", async () => {
  const [i18n, flowCopy, builder, game, pwa, htmlInvite, brand, dashboard] = await Promise.all([
    readFile(new URL("../app/lib/i18n.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/flow-copy.ts", import.meta.url), "utf8"),
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
  for (const source of [builder, game]) assert.match(source, /Record<Locale,T>/);
  for (const source of [pwa, htmlInvite, dashboard]) assert.match(source, /Record<Locale,/);
  assert.doesNotMatch(builder + game + pwa + htmlInvite, /new Proxy/);
  assert.doesNotMatch(game, /from "next\/link"|<Link/);
  assert.match(game, /target="_top"/);
  assert.match(brand, /target="_top"/);
  assert.match(dashboard, /target="_top"/);
  assert.match(i18n, /localStorage\.setItem\("z4sk-locale"/);
});
