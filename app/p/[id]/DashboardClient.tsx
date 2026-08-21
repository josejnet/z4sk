"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sponsor, TopNav } from "../../components/Brand";
import type { Game, GameResponse } from "../../lib/types";
import type { Locale } from "../../lib/i18n";
import { useLanguage } from "../../lib/i18n";
import { flow } from "../../lib/flow-copy";

type DashboardData = { game: Game; responses: GameResponse[]; sealed: boolean };
async function fetchDashboard(id: string, secret: string) { const response = await fetch(`/api/games/${id}/responses`, { cache: "no-store", headers: { authorization: `Bearer ${secret}` } }); const result = await response.json() as DashboardData & { error?: string }; if (!response.ok) throw new Error(result.error); return result; }
function formatDate(value: string, locale: Locale) { const map:Partial<Record<Locale,string>> = { en: "en-US", es: "es-ES", it: "it-IT", fr: "fr-FR", de: "de-DE", zh:"zh-CN", hi:"hi-IN", ja:"ja-JP" }; return new Intl.DateTimeFormat(map[locale]||"en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
const cancelLabel:Record<Locale,string>={en:"Cancel",es:"Cancelar",it:"Annulla",fr:"Annuler",de:"Abbrechen",nl:"Annuleren",eo:"Nuligi",pt:"Cancelar",zh:"取消",hi:"रद्द करें",ja:"キャンセル",tr:"İptal",machine:"ABORT"};

export function DashboardClient({ id }: { id: string }) {
  const [key, setKey] = useState("");
  const { setLocale } = useLanguage();
  const [locale, setGameLocale] = useState<Locale>("en");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<{ questions: string[]; response: GameResponse } | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [confirmRevealOpen, setConfirmRevealOpen] = useState(false);

  useEffect(() => {
    const secret = new URLSearchParams(window.location.hash.slice(1)).get("key") || "";
    let active = true;
    if (!secret) { queueMicrotask(() => { if (active) { setError("Missing secret dashboard key."); setLoading(false); } }); return () => { active = false; }; }
    void fetchDashboard(id, secret).then((result) => { if (active) { setKey(secret); setData(result); setGameLocale(result.game.locale); setLocale(result.game.locale); } }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not open the dashboard."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, setLocale]);
  useEffect(() => { if (!key || !data) return; const timer = window.setInterval(() => { void fetchDashboard(id, key).then((result) => { if (!data.game.openedAt && result.game.openedAt && Notification.permission === "granted") new Notification("Z4SK", { body: `${result.game.recipientName} opened your invitation.` }); setData(result); }); }, 15000); return () => window.clearInterval(timer); }, [data, id, key]);

  async function refresh() { setLoading(true); setError(""); try { const result = await fetchDashboard(id, key); setData(result); setGameLocale(result.game.locale); setLocale(result.game.locale); } catch (cause) { setError(cause instanceof Error ? cause.message : flow(locale, "panelError")); } finally { setLoading(false); } }
  async function revealOnce() { setConfirmRevealOpen(false); setLoading(true); setError(""); try { const response = await fetch(`/api/games/${id}/consume`, { method: "POST", headers: { authorization: `Bearer ${key}` } }); const result = await response.json() as { questions: string[]; response: GameResponse; error?: string }; if (!response.ok) throw new Error(result.error); setRevealed(result); setData(null); history.replaceState({}, "", `/p/${id}`); } catch (cause) { setError(cause instanceof Error ? cause.message : flow(locale, "panelError")); } finally { setLoading(false); } }
  async function copyShare() { const url = `${window.location.origin}/g/${id}`; await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); }
  async function enableNotifications() { if (!("Notification" in window)) return; const permission = await Notification.requestPermission(); setNotifications(permission === "granted"); }
  async function remove() { if (!confirm(flow(locale, "confirmDelete"))) return; const response = await fetch(`/api/games/${id}`, { method: "DELETE", headers: { authorization: `Bearer ${key}` } }); if (response.ok) window.location.href = "/"; }

  if (loading) return <main className="experience-page"><TopNav minimal /><div className="center-state"><div className="loader" /><p>{flow(locale, "panelLoading")}</p></div></main>;
  if (revealed) return <main className="dashboard-page"><TopNav minimal /><section className="revealed-head"><span className="eyebrow">{flow(locale, "onceDeleted")}</span><h1>{flow(locale, "onlyRead")}</h1><p>{flow(locale, "dontClose")}</p></section><section className="responses-wrap"><ResponseCard response={revealed.response} questions={revealed.questions} locale={locale} once /></section></main>;
  if (error || !data) return <main className="experience-page"><TopNav minimal /><div className="center-state"><span className="large-symbol">◆</span><h1>{flow(locale, "panelError")}</h1><p>{error}</p><Link href="/">{flow(locale, "home")}</Link></div></main>;

  const count = data.game.responseCount || 0;
  return <><main className="dashboard-page"><TopNav minimal /><header className="dashboard-head"><div><span className="eyebrow">{flow(locale, "panelOf", { name: data.game.creatorName.toUpperCase() })}</span><h1>{flow(locale, "answersFor")}<br /><em>{data.game.recipientName}.</em></h1><p>◆ {flow(locale, "secret")} {data.game.openedAt ? `· Opened ${formatDate(data.game.openedAt, locale)}` : ""}</p></div><div className="dashboard-stat"><strong>{count}</strong><span>{flow(locale, count === 1 ? "response" : "responses")}</span></div></header><div className="dashboard-toolbar"><button onClick={copyShare}>{copied ? flow(locale, "linkCopied") : flow(locale, "copyAnswer")}</button><button onClick={refresh}>{flow(locale, "refresh")}</button><button onClick={enableNotifications}>{notifications ? "✓ Alerts on" : "Enable alerts"}</button><button className="danger-link" onClick={remove}>{flow(locale, "delete")}</button></div>
    {data.game.viewOnce ? <section className="sealed-wrap">{data.sealed ? <div className="sealed-card"><div className="sealed-orbit"><span>◆</span></div><span className="eyebrow">{flow(locale, "sealed")}</span><h2>{flow(locale, "someone")}</h2><p>{flow(locale, "sealedCopy")}</p><button className="destruct-button" onClick={()=>setConfirmRevealOpen(true)}>{flow(locale, "destroy")} <span>→</span></button><small>{flow(locale, "irreversible")}</small></div> : <EmptyState once locale={locale} onCopy={copyShare} />}</section> : <section className="responses-wrap">{data.responses.length ? data.responses.map((response) => <ResponseCard key={response.id} response={response} questions={data.game.questions} locale={locale} />) : <EmptyState locale={locale} onCopy={copyShare} />}</section>}
    {!data.game.premium && <div className="dashboard-ad"><Sponsor compact /></div>}
  </main>{confirmRevealOpen&&<RevealConfirm locale={locale} onCancel={()=>setConfirmRevealOpen(false)} onConfirm={revealOnce}/>}</>;
}

function RevealConfirm({locale,onCancel,onConfirm}:{locale:Locale;onCancel:()=>void;onConfirm:()=>void}) { return <div className="destructive-dialog-backdrop"><section className="destructive-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reveal-dialog-title" aria-describedby="reveal-dialog-copy"><div className="destructive-dialog-icon">!</div><span className="eyebrow">{flow(locale,"sealed")}</span><h2 id="reveal-dialog-title">{flow(locale,"onlyRead")}</h2><p id="reveal-dialog-copy">{flow(locale,"confirmReveal")}</p><div className="destructive-warnings"><p><b>01</b>{flow(locale,"irreversible")}</p><p><b>02</b>{flow(locale,"dontClose")}</p></div><div className="destructive-dialog-actions"><button type="button" className="dialog-cancel" onClick={onCancel}>← {cancelLabel[locale]}</button><button type="button" className="dialog-confirm" onClick={onConfirm}>{flow(locale,"destroy")} <span>→</span></button></div></section></div>; }

function EmptyState({ locale, once = false, onCopy }: { locale: Locale; once?: boolean; onCopy: () => void }) { return <div className="empty-responses"><span>○</span><h2>{flow(locale, "silent")}</h2><p>{flow(locale, once ? "silentOnce" : "silentNormal")}</p><button onClick={onCopy}>{flow(locale, "copyLink")}</button></div>; }
function ResponseCard({ response, questions, locale, once = false }: { response: GameResponse; questions: string[]; locale: Locale; once?: boolean }) { const [open, setOpen] = useState(true); return <article className={`response-card ${open ? "open" : ""}`}>{response.matched&&<div className="dashboard-match">🔥 MATCH · {response.respondentName}</div>}<button className="response-header" onClick={() => setOpen((value) => !value)}><div className="avatar">{response.respondentName.charAt(0).toUpperCase()}</div><div><h2>{response.respondentName}</h2><span>{formatDate(response.createdAt, locale)}</span></div><em>{once ? flow(locale, "onceDeleted") : open ? flow(locale, "hide") : flow(locale, "viewAnswers")}</em></button>{open && <div className="answers">{questions.map((question, index) => <div key={question}><span>{response.reactions?.[index]||String(index + 1).padStart(2, "0")}</span><section><h3>{question}</h3><p>{response.answers[index]}</p></section></div>)}</div>}</article>; }
