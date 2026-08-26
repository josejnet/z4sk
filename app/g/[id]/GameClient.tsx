"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Sponsor, TopNav } from "../../components/Brand";
import type { Game } from "../../lib/types";
import { type Locale, useLanguage } from "../../lib/i18n";
import { flow } from "../../lib/flow-copy";
import { encryptPrivateResponse } from "../../lib/response-crypto";
import { NAME_RULE_COPY } from "../../lib/name-copy";
import "./emoji-picker.css";

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
const responseDeletionUi:Partial<Record<Locale,{button:string;confirm:string;deleted:string;error:string}>>={
  en:{button:"Delete my response",confirm:"Permanently delete your encrypted response now? This cannot be undone.",deleted:"Your response has been permanently deleted.",error:"Your response could not be deleted."},
  es:{button:"Borrar mi respuesta",confirm:"¿Eliminar ahora tu respuesta cifrada de forma permanente? No se puede deshacer.",deleted:"Tu respuesta se ha eliminado de forma permanente.",error:"No se pudo eliminar tu respuesta."}
};
const emojiPickerLabel=localized<string>({
  en:"ADD TO YOUR ANSWER",es:"AÑADIR A TU RESPUESTA",it:"AGGIUNGI ALLA RISPOSTA",fr:"AJOUTER À VOTRE RÉPONSE",de:"ZUR ANTWORT HINZUFÜGEN",nl:"AAN JE ANTWOORD TOEVOEGEN",eo:"ALDONI AL VIA RESPONDO",pt:"ADICIONAR À RESPOSTA",zh:"添加到回答",hi:"जवाब में जोड़ें",ja:"回答に追加",tr:"YANITA EKLE",machine:"INSERT_EMOJI_AT_CURSOR"
});
const emojiSets:Record<Game["level"],readonly string[]>={
  curioso:["😄","🤭","👀","✨","😂","🙈"],
  coqueto:["😉","😏","🥰","❤️","😘","💫"],
  picante:["🔥","😈","💋","🫦","🥵","👀"],
  sinfiltro:["🔥","😈","🫦","🥵","🍑","💦"]
};
type TimedCopy={badge:string;warning:string;confirmOne:string;confirmTwo:string;seconds:string;expired:string};
const timedCopy=localized<TimedCopy>({
  en:{badge:"30-SECOND CHALLENGE",warning:"Once you start, every question gets its own 30-second countdown.",confirmOne:"I understand I have only 30 seconds to answer each question.",confirmTwo:"I understand that at zero my text is locked, the next question opens automatically and I cannot go back.",seconds:"SECONDS",expired:"⏱ No answer · time expired"},
  es:{badge:"RETO DE 30 SEGUNDOS",warning:"Cuando empieces, cada pregunta tendrá su propia cuenta atrás de 30 segundos.",confirmOne:"Entiendo que solo tengo 30 segundos para responder cada pregunta.",confirmTwo:"Entiendo que al llegar a cero se guarda lo escrito, se abre automáticamente la siguiente pregunta y no podré volver atrás.",seconds:"SEGUNDOS",expired:"⏱ Sin respuesta · tiempo agotado"},
  it:{badge:"SFIDA DA 30 SECONDI",warning:"Dopo l’inizio, ogni domanda avrà un proprio conto alla rovescia di 30 secondi.",confirmOne:"Ho capito di avere solo 30 secondi per rispondere a ogni domanda.",confirmTwo:"Ho capito che a zero il testo viene bloccato, si apre automaticamente la domanda successiva e non posso tornare indietro.",seconds:"SECONDI",expired:"⏱ Nessuna risposta · tempo scaduto"},
  fr:{badge:"DÉFI DE 30 SECONDES",warning:"Après le démarrage, chaque question aura son propre compte à rebours de 30 secondes.",confirmOne:"Je comprends que je n’ai que 30 secondes pour répondre à chaque question.",confirmTwo:"Je comprends qu’à zéro mon texte est verrouillé, la question suivante s’ouvre automatiquement et je ne peux pas revenir en arrière.",seconds:"SECONDES",expired:"⏱ Sans réponse · temps écoulé"},
  de:{badge:"30-SEKUNDEN-CHALLENGE",warning:"Nach dem Start hat jede Frage ihren eigenen 30-Sekunden-Countdown.",confirmOne:"Ich verstehe, dass ich für jede Frage nur 30 Sekunden Zeit habe.",confirmTwo:"Ich verstehe, dass mein Text bei null gesperrt wird, automatisch die nächste Frage erscheint und ich nicht zurückgehen kann.",seconds:"SEKUNDEN",expired:"⏱ Keine Antwort · Zeit abgelaufen"},
  nl:{badge:"30-SECONDENCHALLENGE",warning:"Na de start krijgt elke vraag een eigen aftelling van 30 seconden.",confirmOne:"Ik begrijp dat ik per vraag maar 30 seconden heb.",confirmTwo:"Ik begrijp dat mijn tekst bij nul wordt vastgezet, de volgende vraag automatisch opent en ik niet terug kan.",seconds:"SECONDEN",expired:"⏱ Geen antwoord · tijd verstreken"},
  eo:{badge:"30-SEKUNDA DEFIO",warning:"Post la komenco, ĉiu demando havos propran 30-sekundan retronombradon.",confirmOne:"Mi komprenas, ke mi havas nur 30 sekundojn por ĉiu demando.",confirmTwo:"Mi komprenas, ke je nulo mia teksto fiksiĝas, la sekva demando aŭtomate malfermiĝas kaj mi ne povas reiri.",seconds:"SEKUNDOJ",expired:"⏱ Neniu respondo · tempo finiĝis"},
  pt:{badge:"DESAFIO DE 30 SEGUNDOS",warning:"Depois de começares, cada pergunta terá a sua própria contagem decrescente de 30 segundos.",confirmOne:"Compreendo que só tenho 30 segundos para responder a cada pergunta.",confirmTwo:"Compreendo que, ao chegar a zero, o texto fica bloqueado, a pergunta seguinte abre automaticamente e não posso voltar atrás.",seconds:"SEGUNDOS",expired:"⏱ Sem resposta · tempo esgotado"},
  zh:{badge:"30 秒挑战",warning:"开始后，每道题都会单独进行 30 秒倒计时。",confirmOne:"我明白每道题只有 30 秒作答时间。",confirmTwo:"我明白倒计时归零时，已输入内容会被锁定并自动进入下一题，而且无法返回。",seconds:"秒",expired:"⏱ 未回答 · 时间已到"},
  hi:{badge:"30 सेकंड चुनौती",warning:"शुरू करने के बाद हर सवाल की अपनी 30 सेकंड की उलटी गिनती होगी।",confirmOne:"मैं समझता/समझती हूँ कि हर सवाल का जवाब देने के लिए मेरे पास सिर्फ 30 सेकंड हैं।",confirmTwo:"मैं समझता/समझती हूँ कि समय शून्य होने पर लिखा हुआ जवाब लॉक होगा, अगला सवाल अपने आप खुलेगा और मैं वापस नहीं जा सकूँगा/सकूँगी।",seconds:"सेकंड",expired:"⏱ कोई जवाब नहीं · समय समाप्त"},
  ja:{badge:"30秒チャレンジ",warning:"開始すると、質問ごとに30秒のカウントダウンが始まります。",confirmOne:"各質問の回答時間が30秒だけであることを理解しました。",confirmTwo:"0秒になると入力内容が確定し、自動的に次の質問へ進み、前には戻れないことを理解しました。",seconds:"秒",expired:"⏱ 回答なし・時間切れ"},
  tr:{badge:"30 SANİYE MEYDAN OKUMASI",warning:"Başladıktan sonra her sorunun kendine ait 30 saniyelik geri sayımı olur.",confirmOne:"Her soruyu yanıtlamak için yalnızca 30 saniyem olduğunu anlıyorum.",confirmTwo:"Süre sıfıra geldiğinde yazdıklarımın kilitleneceğini, sonraki sorunun otomatik açılacağını ve geri dönemeyeceğimi anlıyorum.",seconds:"SANİYE",expired:"⏱ Yanıt yok · süre doldu"},
  machine:{badge:"MODE::30S_PER_QUESTION",warning:"ON start => deadline(question)=30s",confirmOne:"ACK deadline_each_question==30s",confirmTwo:"ACK on_zero=LOCK_INPUT+ADVANCE; navigation.back=false",seconds:"SECONDS",expired:"TIMEOUT_NO_ANSWER"}
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
  const [timedConsentOne, setTimedConsentOne] = useState(false);
  const [timedConsentTwo, setTimedConsentTwo] = useState(false);
  const [questionSeconds, setQuestionSeconds] = useState(30);
  const [deletionCredential, setDeletionCredential] = useState<{responseId:string;deletionToken:string}|null>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  useEffect(() => { fetch(`/api/games/${id}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as Game & { error?: string }; if (!response.ok) throw new Error(data.error); setLocale(data.locale); setGame(data); setRespondentName(data.recipientName); setAnswers(Array(data.questions.length).fill("")); setReactions(Array(data.questions.length).fill("")); setIndex(0); setTimedConsentOne(false); setTimedConsentTwo(false); setQuestionSeconds(30); setMatchInterest(null); setPhase("intro"); }).catch(() => { setMessage(gameUi[preferredLocale].openError); setPhase("error"); }); }, [id, preferredLocale, setLocale]);

  async function submit(finalAnswers=answers,finalReactions=reactions) {
    if (!game) return;
    setPhase("sending"); setMessage("");
    try { const encryptedResponse = await encryptPrivateResponse({ respondentName:respondentName.trim().replace(/\s+/g," "), answers:finalAnswers, reactions:finalReactions, matchInterest }, game.encryptionPublicKey); const response = await fetch(`/api/games/${id}/responses`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ encryptedResponse, answerCount: finalAnswers.length }) }); const data = await response.json() as { responseId?:string; deletionToken?:string; error?: string }; if (!response.ok) throw new Error(data.error); if(data.responseId&&data.deletionToken)setDeletionCredential({responseId:data.responseId,deletionToken:data.deletionToken}); setRespondentName(""); setAnswers([]); setReactions([]); setMatchInterest(null); setPhase("done"); }
    catch { setMessage(gameUi[locale].sendError); setQuestionSeconds(30); setPhase("questions"); }
  }

  const handleQuestionTimeout=useEffectEvent(()=>{
    if(!game)return;
    const nextAnswers=answers.map((answer,answerIndex)=>answerIndex===index&&!answer.trim()?timedCopy[game.locale].expired:answer);
    setAnswers(nextAnswers);
    if(index===game.questions.length-1)void submit(nextAnswers,reactions);else{setQuestionSeconds(30);setIndex((value)=>value+1);}
  });

  useEffect(()=>{
    if(!game?.timedMode||phase!=="questions")return;
    const deadline=Date.now()+30_000;
    let handled=false;
    const tick=()=>{const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));setQuestionSeconds(remaining);if(remaining===0&&!handled){handled=true;handleQuestionTimeout();}};
    const timer=window.setInterval(tick,200);
    return()=>window.clearInterval(timer);
  },[game?.timedMode,index,phase]);

  async function reportInvitation() {
    if (!window.confirm(reportCopy[locale].confirm)) return;
    const response = await fetch(`/api/games/${id}/report`, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ reason:"other" }) });
    if (response.ok) setReportSent(true);
  }

  async function deleteOwnResponse() {
    if(!deletionCredential)return;
    const copy=responseDeletionUi[locale]||responseDeletionUi.en!;
    if(!window.confirm(copy.confirm))return;
    const response=await fetch(`/api/games/${id}/responses`,{method:"DELETE",headers:{"content-type":"application/json",authorization:`Bearer ${deletionCredential.deletionToken}`},body:JSON.stringify({responseId:deletionCredential.responseId})});
    if(!response.ok){setMessage(copy.error);return;}
    setDeletionCredential(null);setMessage(copy.deleted);
  }

  function insertEmoji(emoji:string) {
    const textarea=answerRef.current;
    const current=answers[index]||"";
    const start=textarea?.selectionStart??current.length;
    const end=textarea?.selectionEnd??current.length;
    if(current.length-(end-start)+emoji.length>800)return;
    const next=`${current.slice(0,start)}${emoji}${current.slice(end)}`;
    const cursor=start+emoji.length;
    setAnswers((values)=>values.map((value,answerIndex)=>answerIndex===index?next:value));
    setReactions((values)=>values.map((value,reactionIndex)=>reactionIndex===index?emoji:value));
    requestAnimationFrame(()=>{textarea?.focus();textarea?.setSelectionRange(cursor,cursor);});
  }

  function advanceQuestion(){setQuestionSeconds(30);setIndex((value)=>value+1);}

  const locale = game?.locale || preferredLocale;
  if (phase === "loading") return <main className="experience-page"><TopNav minimal /><div className="center-state"><div className="loader" /><p>{flow(locale, "loading")}</p></div></main>;
  if (phase === "error") return <main className="experience-page"><TopNav minimal /><div className="center-state"><span className="large-symbol">×</span><h1>{flow(locale, "closed")}</h1><p>{message}</p><a href="/" target="_top">{flow(locale, "createOwn")}</a></div></main>;
  if (phase === "done" && game) {const deletionCopy=responseDeletionUi[locale]||responseDeletionUi.en!;return <main className="experience-page"><TopNav minimal /><div className="center-state success-state"><span className="large-symbol">✓</span><div className="eyebrow">{flow(locale, "sent")}</div><h1>{flow(locale, "now", { name: game.creatorName })}</h1><p>{flow(locale, game.viewOnce ? "sentOnce" : "sentCopy")}</p>{deletionCredential&&<button type="button" className="text-button" onClick={deleteOwnResponse}>{deletionCopy.button}</button>}{message&&<p role="status">{message}</p>}<a className="primary-link" href="/" target="_top">{flow(locale, "createOther")} →</a><Sponsor compact placement="completion" /></div></main>};
  if (phase === "match" && game) return <main className="experience-page"><TopNav minimal /><div className="center-state blind-question"><span className="large-symbol">◐</span><div className="eyebrow">{matchCopy[locale].blind}</div><h1>{game.matchQuestion.trim()||matchCopy[locale].question.replace("{name}",game.creatorName)}</h1><p>{matchCopy[locale].private}</p><div className="blind-actions"><button onClick={()=>{setMatchInterest(false);setPhase("questions")}}>{matchCopy[locale].no}</button><button className="yes" onClick={()=>{setMatchInterest(true);setPhase("questions")}}>{matchCopy[locale].yes} 🔥</button></div></div></main>;
  if (!game) return null;

  if (phase === "intro") return <main className={`experience-page pack-${game.packSlug}`}><TopNav minimal /><section className="invitation-intro"><div className="invitation-card"><div className="countdown"><span>{matchCopy[locale].time}</span><b>{countdown(game.expiresAt,now)}</b></div><span className="eyebrow">{flow(locale, "from", { name: game.creatorName.toUpperCase() })}</span><div className="intro-spark">✦</div><h1>{game.recipientName},<br /><em>Z4SK.</em></h1><p>{flow(locale, "intro", { count: game.questions.length, name: game.creatorName })}</p>{game.viewOnce && <div className="burn-note"><span>◉</span><p><b>{flow(locale, "single")}</b> {flow(locale, "singleCopy", { name: game.creatorName })}</p></div>}{game.timedMode&&<fieldset className="timed-consent"><legend><span>30</span>{timedCopy[locale].badge}</legend><p>{timedCopy[locale].warning}</p><label htmlFor="timed-confirm-one"><input id="timed-confirm-one" type="checkbox" checked={timedConsentOne} onChange={(event)=>setTimedConsentOne(event.target.checked)}/><span>{timedCopy[locale].confirmOne}</span></label><label htmlFor="timed-confirm-two"><input id="timed-confirm-two" type="checkbox" checked={timedConsentTwo} onChange={(event)=>setTimedConsentTwo(event.target.checked)}/><span>{timedCopy[locale].confirmTwo}</span></label></fieldset>}<label htmlFor="respondent">{flow(locale, "who")}</label><input id="respondent" required minLength={1} maxLength={40} autoComplete="name" aria-describedby="respondent-name-rule" value={respondentName} onChange={(event) => setRespondentName(event.target.value.slice(0, 40))} placeholder={flow(locale, "name")} /><small id="respondent-name-rule" className="name-rule respondent-name-rule">{NAME_RULE_COPY[locale]}</small>{game.level === "sinfiltro" && <label className="age-check"><input type="checkbox" checked={adult} onChange={(event)=>setAdult(event.target.checked)} /><span>{flow(locale, "adult")}</span></label>}<button className="primary" disabled={respondentName.trim().length < 1 || (game.level === "sinfiltro" && !adult) || (game.timedMode && (!timedConsentOne || !timedConsentTwo))} onClick={() => {setQuestionSeconds(30);setPhase(game.doubleBlind?"match":"questions");}}>{flow(locale, "start")} <span>→</span></button><button type="button" className="report-link" disabled={reportSent} onClick={reportInvitation}>{reportSent ? reportCopy[locale].sent : reportCopy[locale].button}</button></div>{!game.premium && <Sponsor compact placement="invitation" />}</section></main>;

  const last = index === game.questions.length - 1;
  return <main className={`question-page pack-${game.packSlug}`}><div className="question-top"><span className="mini-brand">Z4SK</span><span className={`countdown-mini ${game.timedMode?"timed":""}`}>{game.timedMode?`${timedCopy[locale].badge} · ${questionSeconds}s`:`${matchCopy[locale].time} ${countdown(game.expiresAt,now)}`}</span><span>{respondentName}</span></div><div className="question-progress"><i style={{ width: `${((index + 1) / game.questions.length) * 100}%` }} /></div><section className="question-stage"><div className="question-number">{flow(locale, "question")} {String(index + 1).padStart(2, "0")} / {String(game.questions.length).padStart(2, "0")}</div>{game.timedMode&&<div className={`question-timer ${questionSeconds<=10?"urgent":""}`} role="timer" aria-live={questionSeconds<=10?"polite":"off"}><span>{timedCopy[locale].seconds}</span><b>{questionSeconds}</b><div><i style={{width:`${(questionSeconds/30)*100}%`}}/></div></div>}<div className="quote">“</div><h1>{game.questions[index]}</h1><div className="quick-reactions"><span className="emoji-picker-label">{emojiPickerLabel[locale]}</span>{emojiSets[game.level].map((emoji)=><button type="button" key={emoji} className={reactions[index]===emoji?"active":""} aria-label={`${emojiPickerLabel[locale]}: ${emoji}`} aria-pressed={reactions[index]===emoji} title={`${emojiPickerLabel[locale]}: ${emoji}`} onMouseDown={(event)=>event.preventDefault()} onClick={()=>insertEmoji(emoji)}>{emoji}</button>)}</div><textarea ref={answerRef} aria-label={flow(locale, "answer")} value={answers[index]} onChange={(event) => setAnswers((current) => current.map((value, answerIndex) => answerIndex === index ? event.target.value.slice(0, 800) : value))} placeholder={flow(locale, "answer")} /><div className="answer-count">{answers[index].length}/800</div>{message && <p className="form-error">{message}</p>}<div className={`question-actions ${game.timedMode?"timed":""}`}>{!game.timedMode&&<button className="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>← {flow(locale, "previous")}</button>}<button className="primary" disabled={!answers[index].trim() || phase === "sending"} onClick={() => last ? submit() : advanceQuestion()}>{phase === "sending" ? flow(locale, "sending") : last ? flow(locale, "send") : flow(locale, "next")}<span>→</span></button></div><small className="answer-privacy">◆ {flow(locale, "encrypted")}</small></section></main>;
}
