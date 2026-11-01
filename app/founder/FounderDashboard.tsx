"use client";

import { useState } from "react";
import { Brand } from "../components/Brand";

type Row = { label: string; value: number; avg_depth?: number };
type AdConfig = { enabled: boolean; label: string; headline: string; ctaLabel: string; destinationUrl: string; updatedAt?: string };
type AdBreakdown = { label: string; impressions: number; clicks: number };
type AdStats = { impressions: number; clicks: number; ctr: number; placements: AdBreakdown[]; locales: AdBreakdown[]; daily: { day: string; impressions: number; clicks: number }[]; lifetime: { impressions: number; clicks: number }; campaigns: AdBreakdown[] };
type Metrics = { generatedAt: string; events: Row[]; locales: Row[]; countries: Row[]; packs: Row[]; sources: Row[]; libraryVersions: Row[]; daily: { day: string; created: number; opened: number; responded: number }[]; inventory: Record<string, number>; questionSegments: Row[]; last24Hours: Row[]; privacyHealth: Record<string, string | number>; adConfig: AdConfig; adStats: AdStats; privacy: string };

export function FounderDashboard({ showDevelopmentKey = false }: { showDevelopmentKey?: boolean }) {
  const [key, setKey] = useState("");
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/founder/metrics", { cache: "no-store", headers: { authorization: `Bearer ${key}` } });
      const result = await response.json() as Metrics & { error?: string };
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load metrics.");
    } finally { setLoading(false); }
  }

  if (!data) return <main className="founder-login"><Brand /><section><span className="eyebrow">FOUNDER ACCESS</span><h1>Your growth,<br /><em>without the guesswork.</em></h1><p>Private aggregate analytics and sponsor controls. This access cannot return or decrypt response text, respondent names, emails or private invitation links.</p><div><input type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="Founder dashboard key" /><button onClick={load} disabled={!key || loading}>{loading ? "Opening…" : "Open dashboard →"}</button></div>{error && <small>{error}</small>}{showDevelopmentKey && <small>Local development key: dev-founder</small>}</section></main>;

  const get = (name: string) => Number(data.events.find((row) => row.label === name)?.value || 0);
  const created = get("created"), opened = get("opened"), responded = get("responded"), unlocked = get("unlocked");
  return <main className="founder"><header><Brand /><div><span>AGGREGATE ONLY</span><button onClick={() => { setData(null); setKey(""); }}>Lock</button></div></header><section className="founder-title"><div><span className="eyebrow">FOUNDER DASHBOARD</span><h1>Signal over noise.</h1><p>Updated {new Date(data.generatedAt).toLocaleString("en-US")}</p></div><aside><b>{data.inventory.active || 0}</b><span>ACTIVE QUIZZES</span></aside></section><section className="kpi-grid"><Kpi label="Created" value={created} /><Kpi label="Open rate" value={percent(opened, created)} /><Kpi label="Response rate" value={percent(responded, opened)} /><Kpi label="Share unlocks" value={unlocked} /><Kpi label="Active encrypted responses" value={data.inventory.active_responses || 0} /><Kpi label="30s challenges" value={data.inventory.timed_mode || 0} /></section><section className="founder-grid"><Panel title="Sponsor placement"><AdControls founderKey={key} initial={data.adConfig} onSaved={(adConfig) => setData((current) => current ? { ...current, adConfig, adStats: emptyAdStats() } : current)} /></Panel><Panel title="Sponsor performance"><AdPerformance stats={data.adStats} /></Panel><Panel title="Privacy health"><div className="privacy-health"><b>● PURGE ACTIVE</b><span>Last run: {data.privacyHealth.last_run_at ? new Date(String(data.privacyHealth.last_run_at)).toLocaleString("en-US") : "waiting for first run"}</span><span>Responses erased: {Number(data.privacyHealth.total_deleted_responses || 0)}</span><span>Expired games erased: {Number(data.privacyHealth.total_expired_games || 0)}</span></div><p className="metric-note">No answer text, names, match choices, email addresses or private links are available in this dashboard.</p></Panel><Panel title="Last 24 hours"><Bars rows={data.last24Hours} /></Panel><Panel title="14-day funnel"><DailyChart rows={data.daily} /><div className="chart-key"><span>Created</span><span>Opened</span><span>Responded</span></div></Panel><Panel title="Languages"><Bars rows={data.locales} /></Panel><Panel title="Response countries"><Bars rows={data.countries} /></Panel><Panel title="Sponsor packs"><Bars rows={data.packs} /></Panel><Panel title="Question library segments"><Bars rows={data.questionSegments} /></Panel><Panel title="Technology asset"><Bars rows={data.libraryVersions} /><p className="metric-note">Library version adoption and SDK source usage turn the content engine into a separately licensable asset.</p></Panel></section><footer>{data.privacy}</footer></main>;
}

function AdControls({ founderKey, initial, onSaved }: { founderKey: string; initial: AdConfig; onSaved: (config: AdConfig) => void }) {
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setStatus("");
    try {
      const response = await fetch("/api/founder/ads", { method: "PATCH", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json() as AdConfig & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save.");
      const next = { ...draft, ...result };
      setDraft(next); onSaved(next); setStatus("Saved. Public placements update within about one minute.");
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Could not save."); }
    finally { setSaving(false); }
  }
  return <div className="ad-control"><label className="ad-switch"><input type="checkbox" aria-label="Enable sponsor placement" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} /><span><b>{draft.enabled ? "Placement active" : "Placement hidden"}</b><small>One quiet first-party sponsor card. Anonymous aggregate counters only; no targeting or profiles.</small></span></label><label>Small label<input value={draft.label} maxLength={32} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="Sponsor" /></label><label>Message<input value={draft.headline} maxLength={120} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} placeholder="A concise sponsor message" /></label><div className="ad-control-row"><label>Button<input value={draft.ctaLabel} maxLength={32} onChange={(event) => setDraft({ ...draft, ctaLabel: event.target.value })} placeholder="Discover" /></label><label>HTTPS destination<input type="url" value={draft.destinationUrl} maxLength={500} onChange={(event) => setDraft({ ...draft, destinationUrl: event.target.value })} placeholder="https://…" /></label></div><div className="ad-preview"><span>{draft.label || "Sponsor"}</span><p>{draft.headline || "Your discreet sponsor message"}</p><b>{draft.ctaLabel || "Discover"} ↗</b></div><button className="ad-save" type="button" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save placement"}</button>{status && <p className="ad-status" role="status">{status}</p>}</div>;
}

function emptyAdStats():AdStats{return{impressions:0,clicks:0,ctr:0,placements:[],locales:[],daily:[],lifetime:{impressions:0,clicks:0},campaigns:[]}}
function AdPerformance({stats}:{stats:AdStats}){
  const daily=stats.daily.map((row)=>({label:row.day,impressions:row.impressions,clicks:row.clicks}));
  return <div className="ad-performance"><div className="ad-performance-kpis"><div><span>Viewable impressions</span><b>{stats.impressions}</b></div><div><span>Clicks</span><b>{stats.clicks}</b></div><div><span>CTR</span><b>{stats.ctr.toFixed(1)}%</b></div></div><small className="ad-lifetime">Lifetime: {stats.lifetime.impressions} views · {stats.lifetime.clicks} clicks</small><h3>Last 14 days</h3><AdBreakdownTable rows={daily}/><h3>By placement</h3><AdBreakdownTable rows={stats.placements}/><h3>By language</h3><AdBreakdownTable rows={stats.locales}/><h3>Campaign history</h3><AdBreakdownTable rows={stats.campaigns}/><p className="metric-note">A view counts after at least 50% of the card is visible for one second, once per tab, campaign and placement. Counters contain no user or invitation identifier.</p></div>;
}
function AdBreakdownTable({rows}:{rows:AdBreakdown[]}){return <div className="ad-breakdown">{rows.length?rows.map((row)=><div key={row.label}><span>{row.label}</span><b>{Number(row.impressions)} views</b><b>{Number(row.clicks)} clicks</b><strong>{percent(Number(row.clicks),Number(row.impressions))}</strong></div>):<p>No campaign data yet.</p>}</div>}

function percent(part: number, total: number) { return total ? `${Math.round(part / total * 100)}%` : "0%"; }
function Kpi({ label, value }: { label: string; value: string | number }) { return <article><span>{label}</span><strong>{value}</strong></article>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <article className="metric-panel"><h2>{title}</h2>{children}</article>; }
function Bars({ rows }: { rows: Row[] }) { const max = Math.max(1, ...rows.map((row) => Number(row.value))); return <div className="metric-bars">{rows.length ? rows.map((row) => <div key={row.label}><span>{row.label}</span><progress max={max} value={Number(row.value)} aria-label={`${row.label}: ${row.value}`} /><strong>{row.value}</strong></div>) : <p>No data yet.</p>}</div>; }

const chartHeight = 150;
function barHeight(value: number, minimum: number) { return Math.min(chartHeight, Math.max(minimum, Number(value) * 8)); }
function DailyChart({ rows }: { rows: Metrics["daily"] }) {
  return <div className="daily-chart">{rows.map((day) => {
    const created = barHeight(day.created, 4);
    const opened = barHeight(day.opened, 3);
    const responded = barHeight(day.responded, 2);
    return <div key={day.day} title={day.day}><svg viewBox={`0 0 19 ${chartHeight}`} role="img" aria-label={`${day.day}: ${day.created} created, ${day.opened} opened, ${day.responded} responded`}><title>{day.day}: {day.created} created, {day.opened} opened, {day.responded} responded</title><rect className="created" x="0" y={chartHeight-created} width="5" height={created} /><rect className="opened" x="7" y={chartHeight-opened} width="5" height={opened} /><rect className="responded" x="14" y={chartHeight-responded} width="5" height={responded} /></svg><span>{day.day.slice(5)}</span></div>;
  })}</div>;
}
