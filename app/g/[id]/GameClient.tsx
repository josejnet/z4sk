"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useState } from "react";
import { Sponsor, TopNav } from "../../components/Brand";
import type { Game } from "../../lib/types";
import { type Locale, useLanguage } from "../../lib/i18n";
import { flow } from "../../lib/flow-copy";
import { encryptPrivateResponse } from "../../lib/response-crypto";

const localized=<T,>(base:Record<Locale,T>)=>base;
type MatchCopy={question:string;private:string;yes:string;no:string;title:string;copy:string;time:string;blind:string};
const matchCopy = localized<MatchCopy>({
  en:{question:"Would you go on a date with {name}?",private:"Your answer stays hidden unless you both say yes.",yes:"Yes, I would",no:"Not right now",title:"It’s a match!",copy:"You both said yes. No more guessing.",time:"DESTROYS IN",blind:"SECRET MATCH"}, es:{question:"¿Tendrías una cita con {name}?",private:"Tu respuesta queda oculta salvo que ambos digáis que sí.",yes:"Sí, tendría",no:"Ahora mismo no",title:"¡Es un match!",copy:"Los dos habéis dicho que sí. Se acabaron las dudas.",time:"SE DESTRUYE EN",blind:"MATCH SECRETO"}, it:{question:"Usciresti con {name}?",private:"La risposta resta nascosta a meno che entrambi diciate sì.",yes:"Sì",no:"Non adesso",title:"È un match!",copy:"Avete detto sì entrambi. Niente più dubbi.",time:"SI DISTRUGGE TRA",blind:"MATCH SEGRETO"}, fr:{question:"Accepterais-tu un rendez-vous avec {name} ?",private:"La réponse reste cachée sauf si vous dites oui tous les deux.",yes:"Oui",no:"Pas maintenant",title:"C’est un match !",copy:"Vous avez tous les deux dit oui. Plus de doute.",time:"DISPARAÎT DANS",blind:"MATCH SECRET"}, de:{question:"Würdest du mit {name} ausgehen?",private:"Die Antwort bleibt verborgen, außer ihr sagt beide Ja.",yes:"Ja",no:"Jetzt nicht",title:"Ihr habt ein Match!",copy:"Ihr habt beide Ja gesagt. Schluss mit dem Rätselraten.",time:"ZERSTÖRT SICH IN",blind:"GEHEIMES MATCH"},
  nl:{question:"Zou je met {name} op date gaan?",private:"Je antwoord blijft verborgen, tenzij jullie allebei ja zeggen.",yes:"Ja, dat zou ik",no:"Nu niet",title:"Het is een match!",copy:"Jullie zeiden allebei ja. Geen twijfel meer.",time:"WORDT VERNIETIGD OVER",blind:"GEHEIME MATCH"},
  eo:{question:"Ĉu vi rendevuus kun {name}?",private:"Via respondo restas kaŝita krom se ambaŭ diras jes.",yes:"Jes",no:"Ne nun",title:"Estas kongruo!",copy:"Vi ambaŭ diris jes. Ne plu necesas diveni.",time:"DETRUIĜOS POST",blind:"SEKRETA KONGRUO"},
  pt:{question:"Terias um encontro com {name}?",private:"A tua resposta fica oculta, a menos que ambos digam sim.",yes:"Sim, teria",no:"Agora não",title:"É um match!",copy:"Ambos disseram sim. Acabaram-se as dúvidas.",time:"DESTRÓI-SE EM",blind:"MATCH SECRETO"},
  zh:{question:"你愿意和 {name} 约会吗？",private:"除非双方都回答愿意，否则你的答案始终隐藏。",yes:"愿意",no:"现在不愿意",title:"匹配成功！",copy:"你们都回答了愿意，不用再猜了。",time:"将在以下时间后销毁",blind:"秘密匹配"},
  hi:{question:"क्या आप {name} के साथ डेट पर जाना चाहेंगे?",private:"जब तक दोनों हाँ न कहें, आपका जवाब छिपा रहेगा।",yes:"हाँ",no:"अभी नहीं",title:"मैच हो गया!",copy:"आप दोनों ने हाँ कहा। अब अंदाज़ा लगाने की जरूरत नहीं।",time:"इतने समय में मिटेगा",blind:"गुप्त मैच"},
  ja:{question:"{name}さんとデートしたいですか？",private:"二人とも「はい」と答えない限り、回答は公開されません。",yes:"はい",no:"今はいいえ",title:"マッチしました！",copy:"二人とも「はい」と答えました。もう迷う必要はありません。",time:"削除まで",blind:"シークレットマッチ"},
  tr:{question:"{name} ile buluşur muydun?",private:"İkiniz de evet demedikçe yanıtın gizli kalır.",yes:"Evet",no:"Şimdilik hayır",title:"Eşleştiniz!",copy:"İkiniz de evet dediniz. Artık tahmine gerek yok.",time:"YOK OLMASINA",blind:"GİZLİ EŞLEŞME"},
  machine:{question:"DATE_INTEREST target={name}?",private:"reveal IFF creator_interest==true AND respondent_interest==true",yes:"TRUE",no:"FALSE",title:"MATCH=true",copy:"creator_interest=true; respondent_interest=true",time:"TTL",blind:"SECRET_MATCH"}
});
const reportCopy = localized<{button:string;confirm:string;sent:string}>({
  en:{button:"Report invitation",confirm:"Report this invitation for safety review?",sent:"Report sent. Thank you."},
  es:{button:"Denunciar invitación",confirm:"¿Enviar esta invitación a revisión de seguridad?",sent:"Denuncia enviada. Gracias."},
  it:{button:"Segnala invito",confirm:"Inviare questo invito alla revisione di sicurezza?",sent:"Segnalazione inviata. Grazie."},
  fr:{button:"Signaler l’invitation",confirm:"Envoyer cette invitation à l’équipe de sécurité ?",sent:"Signalement envoyé. Merci."},
  de:{button:"Einladung melden",confirm:"Diese Einladung zur Sicherheitsprüfung melden?",sent:"Meldung gesendet. Danke."},
  nl:{button:"Uitnodiging melden",confirm:"Deze uitnodiging melden voor een veiligheidscontrole?",sent:"Melding verzonden. Bedankt."},eo:{button:"Raporti inviton",confirm:"Ĉu sendi ĉi tiun inviton por sekureca kontrolo?",sent:"Raporto sendita. Dankon."},pt:{button:"Denunciar convite",confirm:"Enviar este convite para revisão de segurança?",sent:"Denúncia enviada. Obrigado."},zh:{button:"举报邀请",confirm:"将此邀请提交安全审核？",sent:"举报已发送，谢谢。"},hi:{button:"निमंत्रण की रिपोर्ट करें",confirm:"क्या इस निमंत्रण को सुरक्षा समीक्षा के लिए भेजना है?",sent:"रिपोर्ट भेज दी गई। धन्यवाद।"},ja:{button:"招待を報告",confirm:"この招待を安全確認のため報告しますか？",sent:"報告を送信しました。ありがとうございます。"},tr:{button:"Daveti bildir",confirm:"Bu davet güvenlik incelemesine gönderilsin mi?",sent:"Bildirim gönderildi. Teşekkürler."},machine:{button:"REPORT invitation",confirm:"POST safety_review?",sent:"REPORT_ACCEPTED"}
});
const gameUi=localized<{openError:string;sendError:string}>({
  en:{openError:"Could not open this questionnaire.",sendError:"Could not send your answers."},es:{openError:"No se pudo abrir este cuestionario.",sendError:"No se pudieron enviar tus respuestas."},it:{openError:"Impossibile aprire questo questionario.",sendError:"Impossibile inviare le risposte."},fr:{openError:"Impossible d’ouvrir ce questionnaire.",sendError:"Impossible d’envoyer vos réponses."},de:{openError:"Dieser Fragebogen konnte nicht geöffnet werden.",sendError:"Deine Antworten konnten nicht gesendet werden."},nl:{openError:"Deze vragenlijst kon niet worden geopend.",sendError:"Je antwoorden konden niet worden verstuurd."},eo:{openError:"Ne eblis malfermi ĉi tiun demandaron.",sendError:"Ne eblis sendi viajn respondojn."},pt:{openError:"Não foi possível abrir este questionário.",sendError:"Não foi possível enviar as tuas respostas."},zh:{openError:"无法打开这份问卷。",sendError:"无法发送你的回答。"},hi:{openError:"यह प्रश्नपत्र नहीं खुल सका।",sendError:"आपके जवाब नहीं भेजे जा सके।"},ja:{openError:"この質問を開けませんでした。",sendError:"回答を送信できませんでした。"},tr:{openError:"Bu soru formu açılamadı.",sendError:"Yanıtların gönderilemedi."},machine:{openError:"ERR_QUESTIONNAIRE_OPEN",sendError:"ERR_ANSWERS_POST"}
});
function countdown(expiresAt:string,now:number){const left=Math.max(0,new Date(expiresAt).getTime()-now);const hours=Math.floor(left/3600000);const minutes=Math.floor((left%3600000)/60000);const seconds=Math.floor((left%60000)/1000);return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;}

export function GameClient({ id }: { id: string }) {
  const { locale:preferredLocale,setLocale } = useLanguage();
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "match" | "questions" | "sending" | "done" | "error">("loading");
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

  useEffect(() => { fetch(`/api/games/${id}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as Game & { error?: string }; if (!response.ok) throw new Error(data.error); setLocale(data.locale); setGame(data); setRespondentName(data.recipientName); setAnswers(Array(data.questions.length).fill("")); setReactions(Array(data.questions.length).fill("")); setPhase("intro"); }).catch(() => { setMessage(gameUi[preferredLocale].openError); setPhase("error"); }); }, [id, preferredLocale, setLocale]);

  async function submit() {
    if (!game) return;
    setPhase("sending"); setMessage("");
    try { const encryptedResponse = await encryptPrivateResponse({ respondentName, answers, reactions, matchInterest }, game.encryptionPublicKey); const response = await fetch(`/api/games/${id}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ encryptedResponse, answerCount: answers.length }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error); setRespondentName(""); setAnswers([]); setReactions([]); setMatchInterest(null); setPhase("done"); }
    catch { setMessage(gameUi[locale].sendError); setPhase("questions"); }
  }

  async function reportInvitation() {
    if (!window.confirm(reportCopy[locale].confirm)) return;
    const response = await fetch(`/api/games/${id}/report`, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ reason:"other" }) });
    if (response.ok) setReportSent(true);
  }

  const locale = game?.locale || preferredLocale;
  if (phase === "loading") return <main className="experience-page"><TopNav minimal /><div className="center-state"><div className="loader" /><p>{flow(locale, "loading")}</p></div></main>;
  if (phase === "error") return <main className="experience-page"><TopNav minimal /><div className="center-state"><span className="large-symbol">×</span><h1>{flow(locale, "closed")}</h1><p>{message}</p><a href="/" target="_top">{flow(locale, "createOwn")}</a></div></main>;
  if (phase === "done" && game) return <main className="experience-page"><TopNav minimal /><div className="center-state success-state"><span className="large-symbol">✓</span><div className="eyebrow">{flow(locale, "sent")}</div><h1>{flow(locale, "now", { name: game.creatorName })}</h1><p>{flow(locale, game.viewOnce ? "sentOnce" : "sentCopy")}</p><a className="primary-link" href="/" target="_top">{flow(locale, "createOther")} →</a><Sponsor compact /></div></main>;
  if (phase === "match" && game) return <main className="experience-page"><TopNav minimal /><div className="center-state blind-question"><span className="large-symbol">◐</span><div className="eyebrow">{matchCopy[locale].blind}</div><h1>{matchCopy[locale].question.replace("{name}",game.creatorName)}</h1><p>{matchCopy[locale].private}</p><div className="blind-actions"><button onClick={()=>{setMatchInterest(false);setPhase("questions")}}>{matchCopy[locale].no}</button><button className="yes" onClick={()=>{setMatchInterest(true);setPhase("questions")}}>{matchCopy[locale].yes} 🔥</button></div></div></main>;
  if (!game) return null;

  if (phase === "intro") return <main className={`experience-page pack-${game.packSlug}`}><TopNav minimal /><section className="invitation-intro"><div className="invitation-card"><div className="countdown"><span>{matchCopy[locale].time}</span><b>{countdown(game.expiresAt,now)}</b></div><span className="eyebrow">{flow(locale, "from", { name: game.creatorName.toUpperCase() })}</span><div className="intro-spark">✦</div><h1>{game.recipientName},<br /><em>Z4SK.</em></h1><p>{flow(locale, "intro", { count: game.questions.length, name: game.creatorName })}</p>{game.viewOnce && <div className="burn-note"><span>◉</span><p><b>{flow(locale, "single")}</b> {flow(locale, "singleCopy", { name: game.creatorName })}</p></div>}<label htmlFor="respondent">{flow(locale, "who")}</label><input id="respondent" value={respondentName} onChange={(event) => setRespondentName(event.target.value.slice(0, 40))} placeholder={flow(locale, "name")} />{game.level === "sinfiltro" && <label className="age-check"><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} /><span>{flow(locale, "adult")}</span></label>}<button className="primary" disabled={respondentName.trim().length < 2 || (game.level === "sinfiltro" && !adult)} onClick={() => setPhase(game.doubleBlind?"match":"questions")}>{flow(locale, "start")} <span>→</span></button><button type="button" className="report-link" disabled={reportSent} onClick={reportInvitation}>{reportSent ? reportCopy[locale].sent : reportCopy[locale].button}</button></div>{!game.premium && <Sponsor compact />}</section></main>;

  const last = index === game.questions.length - 1;
  return <main className={`question-page pack-${game.packSlug}`}><div className="question-top"><span className="mini-brand">Z4SK</span><span className="countdown-mini">{matchCopy[locale].time} {countdown(game.expiresAt,now)}</span><span>{respondentName}</span></div><div className="question-progress"><i style={{ width: `${((index + 1) / game.questions.length) * 100}%` }} /></div><section className="question-stage"><div className="question-number">{flow(locale, "question")} {String(index + 1).padStart(2, "0")} / {String(game.questions.length).padStart(2, "0")}</div><div className="quote">“</div><h1>{game.questions[index]}</h1><div className="quick-reactions">{["😳","🔥","❤️","😂"].map((emoji)=><button type="button" key={emoji} className={reactions[index]===emoji?"active":""} onClick={()=>setReactions((current)=>current.map((value,reactionIndex)=>reactionIndex===index?(value===emoji?"":emoji):value))}>{emoji}</button>)}</div><textarea aria-label={flow(locale, "answer")} value={answers[index]} onChange={(event) => setAnswers((current) => current.map((value, answerIndex) => answerIndex === index ? event.target.value.slice(0, 800) : value))} placeholder={flow(locale, "answer")} /><div className="answer-count">{answers[index].length}/800</div>{message && <p className="form-error">{message}</p>}<div className="question-actions"><button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>← {flow(locale, "previous")}</button><button className="primary" disabled={!answers[index].trim() || phase === "sending"} onClick={() => last ? submit() : setIndex((value) => value + 1)}>{phase === "sending" ? flow(locale, "sending") : last ? flow(locale, "send") : flow(locale, "next")}<span>→</span></button></div><small className="answer-privacy">◆ {flow(locale, "encrypted")}</small></section></main>;
}
