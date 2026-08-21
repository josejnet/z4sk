"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sponsor, TopNav } from "../../components/Brand";
import type { Game } from "../../lib/types";
import { useLanguage } from "../../lib/i18n";
import { flow } from "../../lib/flow-copy";

const matchCopy = {
  en:{question:"Would you go on a date with {name}?",private:"Your answer stays hidden unless you both say yes.",yes:"Yes, I would",no:"Not right now",title:"It’s a match!",copy:"You both said yes. No more guessing.",time:"DESTROYS IN"}, es:{question:"¿Tendrías una cita con {name}?",private:"Tu respuesta queda oculta salvo que ambos digáis que sí.",yes:"Sí, tendría",no:"Ahora mismo no",title:"¡Es un match!",copy:"Los dos habéis dicho que sí. Se acabaron las dudas.",time:"SE DESTRUYE EN"}, it:{question:"Usciresti con {name}?",private:"La risposta resta nascosta a meno che entrambi diciate sì.",yes:"Sì",no:"Non adesso",title:"È un match!",copy:"Avete detto sì entrambi. Niente più dubbi.",time:"SI DISTRUGGE TRA"}, fr:{question:"Accepterais-tu un rendez-vous avec {name} ?",private:"La réponse reste cachée sauf si vous dites oui tous les deux.",yes:"Oui",no:"Pas maintenant",title:"C’est un match !",copy:"Vous avez tous les deux dit oui. Plus de doute.",time:"DISPARAÎT DANS"}, de:{question:"Würdest du mit {name} ausgehen?",private:"Die Antwort bleibt verborgen, außer ihr sagt beide Ja.",yes:"Ja",no:"Jetzt nicht",title:"Ihr habt ein Match!",copy:"Ihr habt beide Ja gesagt. Schluss mit dem Rätselraten.",time:"ZERSTÖRT SICH IN"}
};
const reportCopy = {
  en:{button:"Report invitation",confirm:"Report this invitation for safety review?",sent:"Report sent. Thank you."},
  es:{button:"Denunciar invitación",confirm:"¿Enviar esta invitación a revisión de seguridad?",sent:"Denuncia enviada. Gracias."},
  it:{button:"Segnala invito",confirm:"Inviare questo invito alla revisione di sicurezza?",sent:"Segnalazione inviata. Grazie."},
  fr:{button:"Signaler l’invitation",confirm:"Envoyer cette invitation à l’équipe de sécurité ?",sent:"Signalement envoyé. Merci."},
  de:{button:"Einladung melden",confirm:"Diese Einladung zur Sicherheitsprüfung melden?",sent:"Meldung gesendet. Danke."}
};
function countdown(expiresAt:string,now:number){const left=Math.max(0,new Date(expiresAt).getTime()-now);const hours=Math.floor(left/3600000);const minutes=Math.floor((left%3600000)/60000);const seconds=Math.floor((left%60000)/1000);return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;}

export function GameClient({ id }: { id: string }) {
  const { setLocale } = useLanguage();
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "match" | "questions" | "sending" | "matchResult" | "done" | "error">("loading");
  const [message, setMessage] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [adult, setAdult] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reactions, setReactions] = useState<string[]>([]);
  const [matchInterest, setMatchInterest] = useState<boolean | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  useEffect(() => { fetch(`/api/games/${id}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as Game & { error?: string }; if (!response.ok) throw new Error(data.error); setLocale(data.locale); setGame(data); setAnswers(Array(data.questions.length).fill("")); setReactions(Array(data.questions.length).fill("")); setPhase("intro"); }).catch((error) => { setMessage(error.message || "Could not open this questionnaire."); setPhase("error"); }); }, [id, setLocale]);

  async function submit() {
    if (!game) return;
    setPhase("sending"); setMessage("");
    try { const response = await fetch(`/api/games/${id}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ respondentName, answers, reactions, matchInterest }) }); const data = await response.json() as { error?: string; matched?: boolean }; if (!response.ok) throw new Error(data.error); setPhase(data.matched ? "matchResult" : "done"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo enviar."); setPhase("questions"); }
  }

  async function reportInvitation() {
    if (!window.confirm(reportCopy[locale].confirm)) return;
    const response = await fetch(`/api/games/${id}/report`, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ reason:"other" }) });
    if (response.ok) setReportSent(true);
  }

  const locale = game?.locale || "en";
  if (phase === "loading") return <main className="experience-page"><TopNav minimal /><div className="center-state"><div className="loader" /><p>{flow("en", "loading")}</p></div></main>;
  if (phase === "error") return <main className="experience-page"><TopNav minimal /><div className="center-state"><span className="large-symbol">×</span><h1>{flow(locale, "closed")}</h1><p>{message}</p><Link href="/">{flow(locale, "createOwn")}</Link></div></main>;
  if (phase === "done" && game) return <main className="experience-page"><TopNav minimal /><div className="center-state success-state"><span className="large-symbol">✓</span><div className="eyebrow">{flow(locale, "sent")}</div><h1>{flow(locale, "now", { name: game.creatorName })}</h1><p>{flow(locale, game.viewOnce ? "sentOnce" : "sentCopy")}</p><Link className="primary-link" href="/">{flow(locale, "createOther")} →</Link><Sponsor compact /></div></main>;
  if (phase === "matchResult" && game) return <main className="experience-page match-result"><TopNav minimal /><div className="center-state success-state"><div className="match-fire">🔥</div><div className="eyebrow">DOUBLE BLIND</div><h1>{matchCopy[locale].title}</h1><p>{matchCopy[locale].copy}</p><div className="match-names"><span>{game.creatorName}</span><b>♡</b><span>{respondentName}</span></div><Link className="primary-link" href="/">{flow(locale,"createOther")} →</Link></div></main>;
  if (phase === "match" && game) return <main className="experience-page"><TopNav minimal /><div className="center-state blind-question"><span className="large-symbol">◐</span><div className="eyebrow">DOUBLE BLIND</div><h1>{matchCopy[locale].question.replace("{name}",game.creatorName)}</h1><p>{matchCopy[locale].private}</p><div className="blind-actions"><button onClick={()=>{setMatchInterest(false);setPhase("questions")}}>{matchCopy[locale].no}</button><button className="yes" onClick={()=>{setMatchInterest(true);setPhase("questions")}}>{matchCopy[locale].yes} 🔥</button></div></div></main>;
  if (!game) return null;

  if (phase === "intro") return <main className={`experience-page pack-${game.packSlug}`}><TopNav minimal /><section className="invitation-intro"><div className="invitation-card"><div className="countdown"><span>{matchCopy[locale].time}</span><b>{countdown(game.expiresAt,now)}</b></div><span className="eyebrow">{flow(locale, "from", { name: game.creatorName.toUpperCase() })}</span><div className="intro-spark">✦</div><h1>{game.recipientName},<br /><em>Pásalo.</em></h1><p>{flow(locale, "intro", { count: game.questions.length, name: game.creatorName })}</p>{game.viewOnce && <div className="burn-note"><span>◉</span><p><b>{flow(locale, "single")}</b> {flow(locale, "singleCopy", { name: game.creatorName })}</p></div>}<label htmlFor="respondent">{flow(locale, "who")}</label><input id="respondent" value={respondentName} onChange={(event) => setRespondentName(event.target.value.slice(0, 40))} placeholder={flow(locale, "name")} />{game.level === "sinfiltro" && <label className="age-check"><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} /><span>{flow(locale, "adult")}</span></label>}<button className="primary" disabled={respondentName.trim().length < 2 || (game.level === "sinfiltro" && !adult)} onClick={() => setPhase(game.doubleBlind?"match":"questions")}>{flow(locale, "start")} <span>→</span></button><button type="button" className="report-link" disabled={reportSent} onClick={reportInvitation}>{reportSent ? reportCopy[locale].sent : reportCopy[locale].button}</button></div>{!game.premium && <Sponsor compact />}</section></main>;

  const last = index === game.questions.length - 1;
  return <main className={`question-page pack-${game.packSlug}`}><div className="question-top"><span className="mini-brand">PÁSALO</span><span className="countdown-mini">{matchCopy[locale].time} {countdown(game.expiresAt,now)}</span><span>{respondentName}</span></div><div className="question-progress"><i style={{ width: `${((index + 1) / game.questions.length) * 100}%` }} /></div><section className="question-stage"><div className="question-number">{flow(locale, "question")} {String(index + 1).padStart(2, "0")} / {String(game.questions.length).padStart(2, "0")}</div><div className="quote">“</div><h1>{game.questions[index]}</h1><div className="quick-reactions">{["😳","🔥","❤️","😂"].map((emoji)=><button type="button" key={emoji} className={reactions[index]===emoji?"active":""} onClick={()=>setReactions((current)=>current.map((value,reactionIndex)=>reactionIndex===index?(value===emoji?"":emoji):value))}>{emoji}</button>)}</div><textarea aria-label={flow(locale, "answer")} value={answers[index]} onChange={(event) => setAnswers((current) => current.map((value, answerIndex) => answerIndex === index ? event.target.value.slice(0, 800) : value))} placeholder={flow(locale, "answer")} /><div className="answer-count">{answers[index].length}/800</div>{message && <p className="form-error">{message}</p>}<div className="question-actions"><button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>← {flow(locale, "previous")}</button><button className="primary" disabled={!answers[index].trim() || phase === "sending"} onClick={() => last ? submit() : setIndex((value) => value + 1)}>{phase === "sending" ? flow(locale, "sending") : last ? flow(locale, "send") : flow(locale, "next")}<span>→</span></button></div><small className="answer-privacy">◆ {flow(locale, "encrypted")}</small></section></main>;
}
