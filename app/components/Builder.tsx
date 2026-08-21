"use client";

import { useState } from "react";
import { getDefaultQuestions, getLevels, getQuestions } from "../lib/questions";
import type { Level, SavedGame } from "../lib/types";
import { downloadInvitationHtml } from "../lib/html-invite";
import { interpolate, type Locale, useLanguage } from "../lib/i18n";

type Created = { id: string; playUrl: string; adminUrl: string };
const growthCopy: Record<Locale, { title: string; copy: string; button: string; unlocked: string; share: string }> = {
  en: { title: "Make this questionnaire ad-free", copy: "Share Pásalo once. You bring someone new; we remove every ad from this questionnaire.", button: "Share once & remove ads", unlocked: "Unlocked · This questionnaire is now ad-free", share: "Create a private questionnaire and share it on WhatsApp. Ask. Answer. Dare." },
  es: { title: "Deja este cuestionario sin anuncios", copy: "Comparte Pásalo una vez. Tú traes a alguien nuevo y nosotros quitamos todos los anuncios.", button: "Compartir una vez y quitar anuncios", unlocked: "Desbloqueado · Este cuestionario ya no tiene anuncios", share: "Crea un cuestionario privado y compártelo por WhatsApp. Pregunta. Responde. Atrévete." },
  it: { title: "Rendi questo questionario senza pubblicità", copy: "Condividi Pásalo una volta. Tu porti una nuova persona, noi togliamo tutta la pubblicità.", button: "Condividi e rimuovi la pubblicità", unlocked: "Sbloccato · Questo questionario è senza pubblicità", share: "Crea un questionario privato e condividilo su WhatsApp. Domanda. Rispondi. Osa." },
  fr: { title: "Rendez ce questionnaire sans publicité", copy: "Partagez Pásalo une fois. Vous invitez une personne, nous retirons toutes les publicités.", button: "Partager et retirer les publicités", unlocked: "Débloqué · Ce questionnaire est sans publicité", share: "Créez un questionnaire privé et partagez-le sur WhatsApp. Demandez. Répondez. Osez." },
  de: { title: "Diesen Fragebogen werbefrei machen", copy: "Teile Pásalo einmal. Du bringst eine neue Person, wir entfernen sämtliche Werbung.", button: "Teilen und Werbung entfernen", unlocked: "Freigeschaltet · Dieser Fragebogen ist werbefrei", share: "Erstelle einen privaten Fragebogen und teile ihn über WhatsApp. Fragen. Antworten. Trauen." },
};
const smartCopy: Record<Locale, { button: string; note: string }> = {
  en: { button: "✦ SMART MIX™", note: "Optimized from anonymous completion patterns — never answer text." },
  es: { button: "✦ SMART MIX™", note: "Optimizado con patrones anónimos de finalización, nunca con el texto de las respuestas." },
  it: { button: "✦ SMART MIX™", note: "Ottimizzato con dati anonimi di completamento, mai con il testo delle risposte." },
  fr: { button: "✦ SMART MIX™", note: "Optimisé avec des données anonymes de complétion, jamais avec le texte des réponses." },
  de: { button: "✦ SMART MIX™", note: "Optimiert mit anonymen Abschlussdaten, niemals mit Antworttexten." },
};
const paymentCopy: Record<Locale,{title:string;copy:string;soon:string}>={en:{title:"Custom background + advanced stats · $0.99",copy:"One-tap Apple Pay / Google Pay",soon:"NOT ACTIVE YET"},es:{title:"Fondo personalizado + estadísticas · 0,50 €",copy:"Apple Pay / Google Pay en un toque",soon:"AÚN NO ACTIVO"},it:{title:"Sfondo personalizzato + statistiche · 0,50 €",copy:"Apple Pay / Google Pay con un tocco",soon:"NON ANCORA ATTIVO"},fr:{title:"Fond personnalisé + statistiques · 0,50 €",copy:"Apple Pay / Google Pay en un geste",soon:"PAS ENCORE ACTIF"},de:{title:"Eigenes Hintergrundbild + Statistiken · 0,50 €",copy:"Apple Pay / Google Pay mit einem Tippen",soon:"NOCH NICHT AKTIV"}};

export function Builder() {
  const { locale, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [creatorName, setCreatorName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [level, setLevel] = useState<Level>("coqueto");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [doubleBlind, setDoubleBlind] = useState(false);
  const [creatorInterest, setCreatorInterest] = useState(true);
  const [expiresInHours, setExpiresInHours] = useState(12);
  const [packSlug, setPackSlug] = useState("original");
  const [selected, setSelected] = useState<string[]>(() => getDefaultQuestions(locale, "coqueto"));
  const [custom, setCustom] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"play" | "admin" | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [mixing, setMixing] = useState(false);
  const questions = getQuestions(locale, level);
  const canContinue = creatorName.trim().length >= 2 && recipientName.trim().length >= 2 && (level !== "sinfiltro" || adultConfirmed);

  function chooseLevel(next: Level) { setLevel(next); setSelected(getDefaultQuestions(locale, next)); }
  function toggleQuestion(question: string) { setSelected((current) => current.includes(question) ? current.filter((item) => item !== question) : current.length < 12 ? [...current, question] : current); }
  function addCustom() { const value = custom.trim().replace(/\s+/g, " "); if (value.length >= 5 && value.length <= 180 && !selected.includes(value) && selected.length < 12) { setSelected((current) => [...current, value]); setCustom(""); } }

  async function createGame() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ creatorName, recipientName, level, questions: selected, viewOnce, locale, libraryVersion: "2026.08", doubleBlind, creatorInterest, expiresInHours, packSlug }) });
      const data = await response.json() as Created & { error?: string };
      if (!response.ok) throw new Error(data.error || t("formError"));
      setCreated(data);
      const saved: SavedGame = { ...data, recipientName: recipientName.trim(), createdAt: new Date().toISOString() };
      const previous = JSON.parse(localStorage.getItem("pasalo-games") || "[]") as SavedGame[];
      localStorage.setItem("pasalo-games", JSON.stringify([saved, ...previous.filter((item) => item.id !== data.id)].slice(0, 20)));
      setStep(3);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("formError")); } finally { setLoading(false); }
  }

  async function copy(value: string, type: "play" | "admin") { await navigator.clipboard.writeText(value); setCopied(type); setTimeout(() => setCopied(null), 1800); }
  function shareWhatsapp() { if (!created) return; const message = `${interpolate(t("shareText"), { name: recipientName })}\n\n${created.playUrl}`; window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); }

  async function shareToUnlock() {
    if (!created) return;
    try {
      if (navigator.share) await navigator.share({ title: "Pásalo", text: growthCopy[locale].share, url: window.location.origin });
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${growthCopy[locale].share}\n\n${window.location.origin}`)}`, "_blank", "noopener,noreferrer");
      const key = new URL(created.adminUrl).searchParams.get("key");
      const response = await fetch(`/api/games/${created.id}/unlock?key=${encodeURIComponent(key || "")}`, { method: "POST" });
      if (response.ok) setUnlocked(true);
    } catch { /* A cancelled share leaves the questionnaire unchanged. */ }
  }
  async function applySmartMix() { setMixing(true); try { const response = await fetch(`/api/smart-mix?locale=${locale}&level=${level}`); const data = await response.json() as { questions?: string[] }; if (response.ok && data.questions?.length) setSelected(data.questions); } finally { setMixing(false); } }

  return <div className="builder-shell"><div className="builder-top"><div><span className="step">{t("step")} {step} {t("of")} 3</span><h2>{step === 1 ? t("who") : step === 2 ? t("chooseQuestions") : t("ready")}</h2></div><span className="counter">0{step}</span></div><div className="steps-line"><i style={{ width: `${step * 33.333}%` }} /></div>
    {step === 2 && <FeatureConfig locale={locale} doubleBlind={doubleBlind} setDoubleBlind={setDoubleBlind} creatorInterest={creatorInterest} setCreatorInterest={setCreatorInterest} expiresInHours={expiresInHours} setExpiresInHours={setExpiresInHours} packSlug={packSlug} setPackSlug={setPackSlug} />}
    {step === 1 && <div className="step-panel"><div className="two-fields"><div><label htmlFor="creator">{t("yourName")}</label><input id="creator" value={creatorName} onChange={(event) => setCreatorName(event.target.value.slice(0, 40))} placeholder={t("yourExample")} /></div><div><label htmlFor="recipient">{t("theirName")}</label><input id="recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value.slice(0, 40))} placeholder={t("theirExample")} /></div></div><fieldset><legend>{t("chooseIntensity")}</legend><div className="level-grid">{getLevels(locale).map((item) => <button type="button" key={item.id} className={level === item.id ? "active" : ""} onClick={() => chooseLevel(item.id)} aria-pressed={level === item.id}><span className="level-icon">{item.icon}</span><span><b>{item.label}</b><small>{item.copy}</small></span></button>)}</div></fieldset>{level === "sinfiltro" && <label className="age-check"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} /><span>{t("adultConfirm")}</span></label>}<button type="button" className={`ephemeral-option ${viewOnce ? "active" : ""}`} onClick={() => setViewOnce((value) => !value)} aria-pressed={viewOnce}><span className="ephemeral-icon">◉</span><span><b>{t("viewOnce")}</b><small>{t("viewOnceDesc")}</small></span><i>{viewOnce ? t("active") : t("optional")}</i></button><button className="primary" disabled={!canContinue} onClick={() => setStep(2)}>{t("chooseQuestionsBtn")} <span>→</span></button></div>}
    {step === 2 && <div className="step-panel"><div className="selection-meta"><div><p>{t("selectHint")}</p><small>{smartCopy[locale].note}</small></div><strong>{selected.length}/12</strong></div><button className="smart-mix" type="button" onClick={applySmartMix} disabled={mixing}>{mixing ? "…" : smartCopy[locale].button}</button><div className="questions-list">{questions.map((question, index) => <button type="button" key={question} className={selected.includes(question) ? "selected" : ""} onClick={() => toggleQuestion(question)}><span>{String(index + 1).padStart(2, "0")}</span><p>{question}</p><i>{selected.includes(question) ? "✓" : "+"}</i></button>)}</div>{selected.filter((item) => !questions.includes(item)).map((question) => <div className="custom-chip" key={question}><span>{t("own")}</span><p>{question}</p><button onClick={() => toggleQuestion(question)} aria-label={`Remove ${question}`}>×</button></div>)}<div className="custom-row"><input value={custom} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustom(); } }} maxLength={180} placeholder={t("customPlaceholder")} /><button type="button" onClick={addCustom}>{t("add")}</button></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="button-row"><button className="secondary" onClick={() => setStep(1)}>← {t("back")}</button><button className="primary" disabled={selected.length < 3 || loading} onClick={createGame}>{loading ? t("creating") : t("createLink")}<span>→</span></button></div></div>}
    {step === 3 && created && <div className="success-panel"><div className="success-icon">✓</div><span className="success-kicker">{t("created")}</span><h3>{t("interesting")}</h3><p>{interpolate(t("successCopy"), { name: recipientName })}</p><button className="whatsapp-button" onClick={shareWhatsapp}><span>◉</span> {t("shareWhatsapp")}</button><div className="link-box"><span>{t("answerLink")}</span><div><code>{created.playUrl}</code><button onClick={() => copy(created.playUrl, "play")}>{copied === "play" ? t("copied") : t("copy")}</button></div></div><div className="admin-box"><span className="lock">◆</span><div><b>{viewOnce ? t("privateOnce") : t("privatePanel")}</b><p>{viewOnce ? t("privateOnceCopy") : t("secretCopy")}</p><div className="admin-actions"><a href={created.adminUrl}>{t("openPanel")}</a><button onClick={() => copy(created.adminUrl, "admin")}>{copied === "admin" ? t("copied") : t("copySecret")}</button></div></div></div><button className="html-download" onClick={() => downloadInvitationHtml({ creatorName, recipientName, playUrl: created.playUrl, locale })}>{t("downloadHtml")}</button><div className={`growth-unlock ${unlocked ? "unlocked" : ""}`}><span>{unlocked ? "✓" : "↗"}</span><div><b>{unlocked ? growthCopy[locale].unlocked : growthCopy[locale].title}</b>{!unlocked && <p>{growthCopy[locale].copy}</p>}</div>{!unlocked && <button onClick={shareToUnlock}>{growthCopy[locale].button}</button>}</div><button className="text-button" onClick={() => { setCreated(null); setUnlocked(false); setStep(1); }}>{t("createAnother")}</button></div>}
    {step===3&&created&&<div className="one-tap-disabled"><span>◉</span><div><b>{paymentCopy[locale].title}</b><p>{paymentCopy[locale].copy}</p></div><em>{paymentCopy[locale].soon}</em></div>}
  </div>;
}

const featureText: Record<Locale, { blind:string; blindCopy:string; interested:string; yes:string; no:string; expires:string; hours:string; theme:string; original:string; nightlife:string; creator:string }> = {
  en:{blind:"Double Blind Match",blindCopy:"Interest is revealed only if both of you say yes.",interested:"Would you date this person?",yes:"Yes",no:"No",expires:"SELF-DESTRUCT TIMER",hours:"hours",theme:"SPONSORED PACK",original:"Original",nightlife:"Nightlife",creator:"Creator Drop"}, es:{blind:"Match Doble Ciego",blindCopy:"El interés solo se revela si ambos respondéis que sí.",interested:"¿Tendrías una cita con esta persona?",yes:"Sí",no:"No",expires:"TEMPORIZADOR DE AUTODESTRUCCIÓN",hours:"horas",theme:"PACK PATROCINADO",original:"Original",nightlife:"Noche",creator:"Creator Drop"}, it:{blind:"Match Doppio Cieco",blindCopy:"L’interesse si rivela solo se entrambi dite sì.",interested:"Usciresti con questa persona?",yes:"Sì",no:"No",expires:"TIMER DI AUTODISTRUZIONE",hours:"ore",theme:"PACK SPONSORIZZATO",original:"Originale",nightlife:"Nightlife",creator:"Creator Drop"}, fr:{blind:"Match Double Aveugle",blindCopy:"L’intérêt n’est révélé que si vous répondez oui tous les deux.",interested:"Accepteriez-vous un rendez-vous avec cette personne ?",yes:"Oui",no:"Non",expires:"MINUTEUR D’AUTODESTRUCTION",hours:"heures",theme:"PACK SPONSORISÉ",original:"Original",nightlife:"Nightlife",creator:"Creator Drop"}, de:{blind:"Doppelblind-Match",blindCopy:"Interesse wird nur enthüllt, wenn beide Ja sagen.",interested:"Würdest du diese Person daten?",yes:"Ja",no:"Nein",expires:"SELBSTZERSTÖRUNGS-TIMER",hours:"Stunden",theme:"SPONSOREN-PACK",original:"Original",nightlife:"Nightlife",creator:"Creator Drop"}
};
function FeatureConfig({locale,doubleBlind,setDoubleBlind,creatorInterest,setCreatorInterest,expiresInHours,setExpiresInHours,packSlug,setPackSlug}:{locale:Locale;doubleBlind:boolean;setDoubleBlind:(value:boolean)=>void;creatorInterest:boolean;setCreatorInterest:(value:boolean)=>void;expiresInHours:number;setExpiresInHours:(value:number)=>void;packSlug:string;setPackSlug:(value:string)=>void}) { const c=featureText[locale]; return <div className="feature-config"><button type="button" className={`blind-toggle ${doubleBlind?"active":""}`} onClick={()=>setDoubleBlind(!doubleBlind)}><span>◐</span><div><b>{c.blind}</b><small>{c.blindCopy}</small></div><i>{doubleBlind?"ON":"OFF"}</i></button>{doubleBlind&&<div className="interest-row"><span>{c.interested}</span><button className={creatorInterest?"active":""} onClick={()=>setCreatorInterest(true)}>{c.yes}</button><button className={!creatorInterest?"active":""} onClick={()=>setCreatorInterest(false)}>{c.no}</button></div>}<div className="feature-selects"><label>{c.expires}<select value={expiresInHours} onChange={(event)=>setExpiresInHours(Number(event.target.value))}>{[12,24,48,72].map((value)=><option key={value} value={value}>{value} {c.hours}</option>)}</select></label><label>{c.theme}<select value={packSlug} onChange={(event)=>setPackSlug(event.target.value)}><option value="original">{c.original}</option><option value="nightlife">{c.nightlife}</option><option value="creator">{c.creator}</option></select></label></div></div>; }
