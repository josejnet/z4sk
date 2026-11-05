"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { Sponsor, TopNav } from "../../components/Brand";
import { SharedKeyUnlock } from "../../components/SharedKeyUnlock";
import type { EncryptedGameWire, Game, GameWire } from "../../lib/types";
import { type Locale, useLanguage } from "../../lib/i18n";
import { flow } from "../../lib/flow-copy";
import { encryptPrivateResponse } from "../../lib/response-crypto";
import {
  hydrateGameWire,
  isEncryptedGameWire,
} from "../../lib/invitation-crypto";
import { NAME_RULE_COPY } from "../../lib/name-copy";
import { CANCELLATION_COPY } from "../../lib/cancellation-copy";
import { TOO_LATE_COPY } from "../../lib/too-late-copy";
import "./emoji-picker.css";

const localized = <T,>(base: Record<Locale, T>) => base;
const expiryCopy: Record<Locale, string> = {
  en: "DESTROYS IN",
  es: "SE DESTRUYE EN",
  it: "SI DISTRUGGE TRA",
  fr: "DISPARAÎT DANS",
  de: "ZERSTÖRT SICH IN",
  nl: "WORDT VERNIETIGD OVER",
  eo: "DETRUIĜOS POST",
  pt: "DESTRÓI-SE EM",
  zh: "将在以下时间后销毁",
  hi: "इतने समय में मिटेगा",
  ja: "削除まで",
  tr: "YOK OLMASINA",
  machine: "TTL",
};
const reportCopy = localized<{ button: string; confirm: string; sent: string }>(
  {
    en: {
      button: "Report invitation",
      confirm: "Report this invitation for safety review?",
      sent: "Report sent. Thank you.",
    },
    es: {
      button: "Denunciar invitación",
      confirm: "¿Enviar esta invitación a revisión de seguridad?",
      sent: "Denuncia enviada. Gracias.",
    },
    it: {
      button: "Segnala invito",
      confirm: "Inviare questo invito alla revisione di sicurezza?",
      sent: "Segnalazione inviata. Grazie.",
    },
    fr: {
      button: "Signaler l’invitation",
      confirm: "Envoyer cette invitation à l’équipe de sécurité ?",
      sent: "Signalement envoyé. Merci.",
    },
    de: {
      button: "Einladung melden",
      confirm: "Diese Einladung zur Sicherheitsprüfung melden?",
      sent: "Meldung gesendet. Danke.",
    },
    nl: {
      button: "Uitnodiging melden",
      confirm: "Deze uitnodiging melden voor een veiligheidscontrole?",
      sent: "Melding verzonden. Bedankt.",
    },
    eo: {
      button: "Raporti inviton",
      confirm: "Ĉu sendi ĉi tiun inviton por sekureca kontrolo?",
      sent: "Raporto sendita. Dankon.",
    },
    pt: {
      button: "Denunciar convite",
      confirm: "Enviar este convite para revisão de segurança?",
      sent: "Denúncia enviada. Obrigado.",
    },
    zh: {
      button: "举报邀请",
      confirm: "将此邀请提交安全审核？",
      sent: "举报已发送，谢谢。",
    },
    hi: {
      button: "निमंत्रण की रिपोर्ट करें",
      confirm: "क्या इस निमंत्रण को सुरक्षा समीक्षा के लिए भेजना है?",
      sent: "रिपोर्ट भेज दी गई। धन्यवाद।",
    },
    ja: {
      button: "招待を報告",
      confirm: "この招待を安全確認のため報告しますか？",
      sent: "報告を送信しました。ありがとうございます。",
    },
    tr: {
      button: "Daveti bildir",
      confirm: "Bu davet güvenlik incelemesine gönderilsin mi?",
      sent: "Bildirim gönderildi. Teşekkürler.",
    },
    machine: {
      button: "REPORT invitation",
      confirm: "POST safety_review?",
      sent: "REPORT_ACCEPTED",
    },
  },
);
const gameUi = localized<{ openError: string; sendError: string }>({
  en: {
    openError: "Could not open this questionnaire.",
    sendError: "Could not send your answers.",
  },
  es: {
    openError: "No se pudo abrir este cuestionario.",
    sendError: "No se pudieron enviar tus respuestas.",
  },
  it: {
    openError: "Impossibile aprire questo questionario.",
    sendError: "Impossibile inviare le risposte.",
  },
  fr: {
    openError: "Impossible d’ouvrir ce questionnaire.",
    sendError: "Impossible d’envoyer vos réponses.",
  },
  de: {
    openError: "Dieser Fragebogen konnte nicht geöffnet werden.",
    sendError: "Deine Antworten konnten nicht gesendet werden.",
  },
  nl: {
    openError: "Deze vragenlijst kon niet worden geopend.",
    sendError: "Je antwoorden konden niet worden verstuurd.",
  },
  eo: {
    openError: "Ne eblis malfermi ĉi tiun demandaron.",
    sendError: "Ne eblis sendi viajn respondojn.",
  },
  pt: {
    openError: "Não foi possível abrir este questionário.",
    sendError: "Não foi possível enviar as tuas respostas.",
  },
  zh: { openError: "无法打开这份问卷。", sendError: "无法发送你的回答。" },
  hi: {
    openError: "यह प्रश्नपत्र नहीं खुल सका।",
    sendError: "आपके जवाब नहीं भेजे जा सके।",
  },
  ja: {
    openError: "この質問を開けませんでした。",
    sendError: "回答を送信できませんでした。",
  },
  tr: {
    openError: "Bu soru formu açılamadı.",
    sendError: "Yanıtların gönderilemedi.",
  },
  machine: {
    openError: "ERR_QUESTIONNAIRE_OPEN",
    sendError: "ERR_ANSWERS_POST",
  },
});
const keyIntegrityError: Record<Locale, string> = {
  en: "This invitation cannot verify its encryption key. Do not answer; ask the sender for a new link.",
  es: "Esta invitación no puede verificar su clave de cifrado. No respondas; pide a quien la envió un enlace nuevo.",
  it: "Questo invito non può verificare la chiave di cifratura. Non rispondere; chiedi un nuovo link.",
  fr: "Cette invitation ne peut pas vérifier sa clé de chiffrement. Ne répondez pas ; demandez un nouveau lien.",
  de: "Der Verschlüsselungsschlüssel dieser Einladung kann nicht geprüft werden. Antworte nicht und bitte um einen neuen Link.",
  nl: "De versleutelingssleutel van deze uitnodiging kan niet worden geverifieerd. Antwoord niet en vraag om een nieuwe link.",
  eo: "La ĉifra ŝlosilo de ĉi tiu invito ne povas esti kontrolita. Ne respondu; petu novan ligilon.",
  pt: "Não foi possível verificar a chave de cifra deste convite. Não respondas; pede um novo link.",
  zh: "无法验证此邀请的加密密钥。请勿回答，并向发送者索取新链接。",
  hi: "इस निमंत्रण की एन्क्रिप्शन कुंजी सत्यापित नहीं हो सकी। जवाब न दें; नया लिंक माँगें।",
  ja: "この招待の暗号鍵を確認できません。回答せず、送信者に新しいリンクを依頼してください。",
  tr: "Bu davetin şifreleme anahtarı doğrulanamıyor. Yanıt verme; gönderenden yeni bir bağlantı iste.",
  machine:
    "ERR_ENCRYPTION_KEY_FINGERPRINT; submit=false; request_new_link=true",
};
const emojiPickerLabel = localized<string>({
  en: "ADD TO YOUR ANSWER",
  es: "AÑADIR A TU RESPUESTA",
  it: "AGGIUNGI ALLA RISPOSTA",
  fr: "AJOUTER À VOTRE RÉPONSE",
  de: "ZUR ANTWORT HINZUFÜGEN",
  nl: "AAN JE ANTWOORD TOEVOEGEN",
  eo: "ALDONI AL VIA RESPONDO",
  pt: "ADICIONAR À RESPOSTA",
  zh: "添加到回答",
  hi: "जवाब में जोड़ें",
  ja: "回答に追加",
  tr: "YANITA EKLE",
  machine: "INSERT_EMOJI_AT_CURSOR",
});
const emojiSets: Record<Game["level"], readonly string[]> = {
  curioso: ["😄", "🤭", "👀", "✨", "😂", "🙈"],
  coqueto: ["😉", "😏", "🥰", "❤️", "😘", "💫"],
  picante: ["🔥", "😈", "💋", "🫦", "🥵", "👀"],
  sinfiltro: ["🔥", "😈", "🫦", "🥵", "🍑", "💦"],
};
type TimedCopy = {
  badge: string;
  warning: string;
  confirmOne: string;
  confirmTwo: string;
  seconds: string;
  expired: string;
};
const timedCopy = localized<TimedCopy>({
  en: {
    badge: "ONLY 15 SECONDS PER QUESTION",
    warning: "Important: once you start, every question has a countdown of only 15 seconds.",
    confirmOne: "I understand I have only 15 seconds to answer each question.",
    confirmTwo:
      "I understand that at zero my text is locked, the next question opens automatically and I cannot go back.",
    seconds: "SECONDS",
    expired: "⏱ No answer · time expired",
  },
  es: {
    badge: "SOLO 15 SEGUNDOS POR PREGUNTA",
    warning:
      "Importante: en cuanto empieces, cada pregunta tendrá una cuenta atrás de solo 15 segundos.",
    confirmOne:
      "Entiendo que solo tengo 15 segundos para responder cada pregunta.",
    confirmTwo:
      "Entiendo que al llegar a cero se guarda lo escrito, se abre automáticamente la siguiente pregunta y no podré volver atrás.",
    seconds: "SEGUNDOS",
    expired: "⏱ Sin respuesta · tiempo agotado",
  },
  it: {
    badge: "SOLO 15 SECONDI PER DOMANDA",
    warning:
      "Importante: dopo l’inizio, ogni domanda avrà un conto alla rovescia di soli 15 secondi.",
    confirmOne:
      "Ho capito di avere solo 15 secondi per rispondere a ogni domanda.",
    confirmTwo:
      "Ho capito che a zero il testo viene bloccato, si apre automaticamente la domanda successiva e non posso tornare indietro.",
    seconds: "SECONDI",
    expired: "⏱ Nessuna risposta · tempo scaduto",
  },
  fr: {
    badge: "15 SECONDES SEULEMENT PAR QUESTION",
    warning:
      "Important : après le démarrage, chaque question aura un compte à rebours de 15 secondes seulement.",
    confirmOne:
      "Je comprends que je n’ai que 15 secondes pour répondre à chaque question.",
    confirmTwo:
      "Je comprends qu’à zéro mon texte est verrouillé, la question suivante s’ouvre automatiquement et je ne peux pas revenir en arrière.",
    seconds: "SECONDES",
    expired: "⏱ Sans réponse · temps écoulé",
  },
  de: {
    badge: "NUR 15 SEKUNDEN PRO FRAGE",
    warning:
      "Wichtig: Nach dem Start hat jede Frage einen Countdown von nur 15 Sekunden.",
    confirmOne:
      "Ich verstehe, dass ich für jede Frage nur 15 Sekunden Zeit habe.",
    confirmTwo:
      "Ich verstehe, dass mein Text bei null gesperrt wird, automatisch die nächste Frage erscheint und ich nicht zurückgehen kann.",
    seconds: "SEKUNDEN",
    expired: "⏱ Keine Antwort · Zeit abgelaufen",
  },
  nl: {
    badge: "SLECHTS 15 SECONDEN PER VRAAG",
    warning:
      "Belangrijk: na de start krijgt elke vraag een aftelling van slechts 15 seconden.",
    confirmOne: "Ik begrijp dat ik per vraag maar 15 seconden heb.",
    confirmTwo:
      "Ik begrijp dat mijn tekst bij nul wordt vastgezet, de volgende vraag automatisch opent en ik niet terug kan.",
    seconds: "SECONDEN",
    expired: "⏱ Geen antwoord · tijd verstreken",
  },
  eo: {
    badge: "NUR 15 SEKUNDOJ POR DEMANDO",
    warning:
      "Grave: post la komenco, ĉiu demando havos retronombradon de nur 15 sekundoj.",
    confirmOne: "Mi komprenas, ke mi havas nur 15 sekundojn por ĉiu demando.",
    confirmTwo:
      "Mi komprenas, ke je nulo mia teksto fiksiĝas, la sekva demando aŭtomate malfermiĝas kaj mi ne povas reiri.",
    seconds: "SEKUNDOJ",
    expired: "⏱ Neniu respondo · tempo finiĝis",
  },
  pt: {
    badge: "APENAS 15 SEGUNDOS POR PERGUNTA",
    warning:
      "Importante: depois de começares, cada pergunta terá uma contagem de apenas 15 segundos.",
    confirmOne:
      "Compreendo que só tenho 15 segundos para responder a cada pergunta.",
    confirmTwo:
      "Compreendo que, ao chegar a zero, o texto fica bloqueado, a pergunta seguinte abre automaticamente e não posso voltar atrás.",
    seconds: "SEGUNDOS",
    expired: "⏱ Sem resposta · tempo esgotado",
  },
  zh: {
    badge: "每题仅 15 秒",
    warning: "重要：开始后，每道题都只有 15 秒倒计时。",
    confirmOne: "我明白每道题只有 15 秒作答时间。",
    confirmTwo:
      "我明白倒计时归零时，已输入内容会被锁定并自动进入下一题，而且无法返回。",
    seconds: "秒",
    expired: "⏱ 未回答 · 时间已到",
  },
  hi: {
    badge: "हर सवाल के लिए केवल 15 सेकंड",
    warning: "महत्वपूर्ण: शुरू करने के बाद हर सवाल के लिए केवल 15 सेकंड की उलटी गिनती होगी।",
    confirmOne:
      "मैं समझता/समझती हूँ कि हर सवाल का जवाब देने के लिए मेरे पास सिर्फ 15 सेकंड हैं।",
    confirmTwo:
      "मैं समझता/समझती हूँ कि समय शून्य होने पर लिखा हुआ जवाब लॉक होगा, अगला सवाल अपने आप खुलेगा और मैं वापस नहीं जा सकूँगा/सकूँगी।",
    seconds: "सेकंड",
    expired: "⏱ कोई जवाब नहीं · समय समाप्त",
  },
  ja: {
    badge: "1問につき15秒のみ",
    warning: "重要：開始すると、質問ごとに15秒だけのカウントダウンが始まります。",
    confirmOne: "各質問の回答時間が15秒だけであることを理解しました。",
    confirmTwo:
      "0秒になると入力内容が確定し、自動的に次の質問へ進み、前には戻れないことを理解しました。",
    seconds: "秒",
    expired: "⏱ 回答なし・時間切れ",
  },
  tr: {
    badge: "HER SORU İÇİN YALNIZCA 15 SANİYE",
    warning:
      "Önemli: başladıktan sonra her sorunun yalnızca 15 saniyelik geri sayımı olur.",
    confirmOne:
      "Her soruyu yanıtlamak için yalnızca 15 saniyem olduğunu anlıyorum.",
    confirmTwo:
      "Süre sıfıra geldiğinde yazdıklarımın kilitleneceğini, sonraki sorunun otomatik açılacağını ve geri dönemeyeceğimi anlıyorum.",
    seconds: "SANİYE",
    expired: "⏱ Yanıt yok · süre doldu",
  },
  machine: {
    badge: "ONLY_15S_PER_QUESTION",
    warning: "IMPORTANT: ON start => deadline(question)=15s",
    confirmOne: "ACK deadline_each_question==15s",
    confirmTwo: "ACK on_zero=LOCK_INPUT+ADVANCE; navigation.back=false",
    seconds: "SECONDS",
    expired: "TIMEOUT_NO_ANSWER",
  },
});
const QUESTION_TIME_LIMIT_SECONDS = 15;
function countdown(expiresAt: string, now: number) {
  const left = Math.max(0, new Date(expiresAt).getTime() - now);
  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function GameClient({ id }: { id: string }) {
  const { locale: preferredLocale, setLocale } = useLanguage();
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<
    | "loading"
    | "shared-key"
    | "intro"
    | "questions"
    | "sending"
    | "done"
    | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [adult, setAdult] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reactions, setReactions] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [reportSent, setReportSent] = useState(false);
  const [timedConsentOne, setTimedConsentOne] = useState(false);
  const [timedConsentTwo, setTimedConsentTwo] = useState(false);
  const [questionSeconds, setQuestionSeconds] = useState(
    QUESTION_TIME_LIMIT_SECONDS,
  );
  const [deletionCredential, setDeletionCredential] = useState<{
    responseId: string;
    deletionToken: string;
  } | null>(null);
  const [cancellationUrl, setCancellationUrl] = useState("");
  const [cancellationCopied, setCancellationCopied] = useState(false);
  const [tooLate, setTooLate] = useState(false);
  const [pendingGame, setPendingGame] = useState<EncryptedGameWire | null>(
    null,
  );
  const [invitationSecret, setInvitationSecret] = useState("");
  const [submissionToken, setSubmissionToken] = useState("");
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const initialLoadRef = useRef(false);

  const acceptGame = useCallback(
    (decryptedGame: Game) => {
      setLocale(decryptedGame.locale);
      setGame(decryptedGame);
      setRespondentName(decryptedGame.recipientName);
      setAnswers(Array(decryptedGame.questions.length).fill(""));
      setReactions(Array(decryptedGame.questions.length).fill(""));
      setIndex(0);
      setTimedConsentOne(false);
      setTimedConsentTwo(false);
      setQuestionSeconds(QUESTION_TIME_LIMIT_SECONDS);
      setPendingGame(null);
      setPhase("intro");
    },
    [setLocale],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    fetch(`/api/games/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as GameWire & { error?: string };
        if (!response.ok) {
          if ([404, 409, 410].includes(response.status)) {
            setTooLate(true);
            setMessage(TOO_LATE_COPY[preferredLocale].questions);
            setPhase("error");
            return;
          }
          throw new Error(data.error);
        }
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        if (!isEncryptedGameWire(data)) {
          setMessage(keyIntegrityError[preferredLocale]);
          setPhase("error");
          return;
        }
        const secret = fragment.get("invite") || "";
        setSubmissionToken(fragment.get("submit") || "");
        setInvitationSecret(secret);
        if (data.encryptedInvitation.keyMode === "link") {
          try {
            acceptGame(await hydrateGameWire(data, secret, ""));
          } catch {
            setMessage(keyIntegrityError[preferredLocale]);
            setPhase("error");
          }
        } else {
          setPendingGame(data);
          setPhase("shared-key");
        }
      })
      .catch(() => {
        setMessage(gameUi[preferredLocale].openError);
        setPhase("error");
      });
  }, [acceptGame, id, preferredLocale]);

  async function unlockInvitation(sharedKey: string) {
    if (!pendingGame) throw new Error("No pending invitation.");
    try {
      acceptGame(
        await hydrateGameWire(pendingGame, invitationSecret, sharedKey),
      );
    } catch {
      throw new Error(keyIntegrityError[preferredLocale]);
    }
  }

  async function submit(finalAnswers = answers, finalReactions = reactions) {
    if (!game) return;
    setPhase("sending");
    setMessage("");
    try {
      const encryptedResponse = await encryptPrivateResponse(
        {
          respondentName: respondentName.trim().replace(/\s+/g, " "),
          answers: finalAnswers,
          reactions: finalReactions,
        },
        game.encryptionPublicKey,
      );
      const response = await fetch(`/api/games/${id}/responses`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(submissionToken
            ? { authorization: `Bearer ${submissionToken}` }
            : {}),
        },
        body: JSON.stringify({
          encryptedResponse,
          answerCount: finalAnswers.length,
        }),
      });
      const data = (await response.json()) as {
        responseId?: string;
        deletionToken?: string;
        error?: string;
      };
      if (!response.ok) {
        if ([404, 409, 410].includes(response.status)) {
          setTooLate(true);
          setMessage(TOO_LATE_COPY[locale].questions);
          setPhase("error");
          return;
        }
        throw new Error(data.error);
      }
      if (data.responseId && data.deletionToken) {
        const credential = {
          responseId: data.responseId,
          deletionToken: data.deletionToken,
        };
        const cancelUrl = `${window.location.origin}/cancel/${id}#response=${encodeURIComponent(credential.responseId)}&delete=${encodeURIComponent(credential.deletionToken)}&lang=${encodeURIComponent(game.locale)}`;
        setDeletionCredential(credential);
        setCancellationUrl(cancelUrl);
        window.history.replaceState({}, "", cancelUrl);
      }
      setRespondentName("");
      setAnswers([]);
      setReactions([]);
      setPhase("done");
    } catch {
      setMessage(gameUi[locale].sendError);
      setQuestionSeconds(QUESTION_TIME_LIMIT_SECONDS);
      setPhase("questions");
    }
  }

  const handleQuestionTimeout = useEffectEvent(() => {
    if (!game) return;
    const nextAnswers = answers.map((answer, answerIndex) =>
      answerIndex === index && !answer.trim()
        ? timedCopy[game.locale].expired
        : answer,
    );
    setAnswers(nextAnswers);
    if (index === game.questions.length - 1)
      void submit(nextAnswers, reactions);
    else {
      setQuestionSeconds(QUESTION_TIME_LIMIT_SECONDS);
      setIndex((value) => value + 1);
    }
  });

  useEffect(() => {
    if (!game?.timedMode || phase !== "questions") return;
    const deadline = Date.now() + QUESTION_TIME_LIMIT_SECONDS * 1000;
    let handled = false;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setQuestionSeconds(remaining);
      if (remaining === 0 && !handled) {
        handled = true;
        handleQuestionTimeout();
      }
    };
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [game?.timedMode, index, phase]);

  async function reportInvitation() {
    if (!window.confirm(reportCopy[locale].confirm)) return;
    const response = await fetch(`/api/games/${id}/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "other" }),
    });
    if (response.ok) setReportSent(true);
  }

  async function deleteOwnResponse() {
    if (!deletionCredential) return;
    const copy = CANCELLATION_COPY[locale];
    if (!window.confirm(copy.confirm)) return;
    const response = await fetch(`/api/games/${id}/responses`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${deletionCredential.deletionToken}`,
      },
      body: JSON.stringify({ responseId: deletionCredential.responseId }),
    });
    if (!response.ok) {
      setMessage(copy.error);
      return;
    }
    window.history.replaceState({}, "", `/cancel/${id}`);
    setDeletionCredential(null);
    setCancellationUrl("");
    setMessage(copy.deleted);
  }

  async function copyCancellationLink() {
    if (!cancellationUrl) return;
    await navigator.clipboard.writeText(cancellationUrl);
    setCancellationCopied(true);
    window.setTimeout(() => setCancellationCopied(false), 1800);
  }

  function insertEmoji(emoji: string) {
    const textarea = answerRef.current;
    const current = answers[index] || "";
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    if (current.length - (end - start) + emoji.length > 800) return;
    const next = `${current.slice(0, start)}${emoji}${current.slice(end)}`;
    const cursor = start + emoji.length;
    setAnswers((values) =>
      values.map((value, answerIndex) =>
        answerIndex === index ? next : value,
      ),
    );
    setReactions((values) =>
      values.map((value, reactionIndex) =>
        reactionIndex === index ? emoji : value,
      ),
    );
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  function advanceQuestion() {
    setQuestionSeconds(QUESTION_TIME_LIMIT_SECONDS);
    setIndex((value) => value + 1);
  }

  const locale = preferredLocale;
  if (phase === "loading")
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className="center-state">
          <div className="loader" />
          <p>{flow(locale, "loading")}</p>
        </div>
      </main>
    );
  if (phase === "shared-key")
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className="shared-key-unlock-page">
          <SharedKeyUnlock locale={preferredLocale} onKey={unlockInvitation} />
        </div>
      </main>
    );
  if (phase === "error")
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className={`center-state ${tooLate ? "too-late-state" : ""}`}>
          <span className="large-symbol" aria-hidden="true">
            {tooLate ? "⌛" : "×"}
          </span>
          <h1>
            {tooLate ? TOO_LATE_COPY[locale].title : flow(locale, "closed")}
          </h1>
          <p>{tooLate ? TOO_LATE_COPY[locale].questions : message}</p>
          <a href="/" target="_top">
            {flow(locale, "createOwn")}
          </a>
        </div>
      </main>
    );
  if (phase === "done" && game) {
    const deletionCopy = CANCELLATION_COPY[locale];
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className="center-state success-state">
          <span className="large-symbol">✓</span>
          <div className="eyebrow">{flow(locale, "sent")}</div>
          <h1>{flow(locale, "now", { name: game.creatorName })}</h1>
          <p>{flow(locale, game.viewOnce ? "sentOnce" : "sentCopy")}</p>
          {deletionCredential && (
            <div className="cancellation-box">
              <b>{deletionCopy.saveTitle}</b>
              <p>{deletionCopy.saveCopy}</p>
              <p className="cancellation-warning">{deletionCopy.afterRead}</p>
              <div>
                <button type="button" onClick={copyCancellationLink}>
                  {cancellationCopied
                    ? deletionCopy.copied
                    : deletionCopy.copyLink}
                </button>
                <button
                  type="button"
                  className="danger-link"
                  onClick={deleteOwnResponse}
                >
                  {deletionCopy.deleteButton}
                </button>
              </div>
            </div>
          )}
          {message && <p role="status">{message}</p>}
          <a className="primary-link" href="/" target="_top">
            {flow(locale, "createOther")} →
          </a>
          <Sponsor compact placement="completion" />
        </div>
      </main>
    );
  }
  if (!game) return null;

  if (phase === "intro")
    return (
      <main className={`experience-page pack-${game.packSlug}`}>
        <TopNav minimal />
        <section className="invitation-intro">
          <div className="invitation-card">
            <div className="countdown">
              <span>{expiryCopy[locale]}</span>
              <b>{countdown(game.expiresAt, now)}</b>
            </div>
            <span className="eyebrow">
              {flow(locale, "from", { name: game.creatorName.toUpperCase() })}
            </span>
            <div className="intro-spark">✦</div>
            <h1>
              {game.recipientName},<br />
              <em>Z4SK.</em>
            </h1>
            <p>
              {flow(locale, "intro", {
                count: game.questions.length,
                name: game.creatorName,
              })}
            </p>
            {game.viewOnce && (
              <div className="burn-note">
                <span>◉</span>
                <p>
                  <b>{flow(locale, "single")}</b>{" "}
                  {flow(locale, "singleCopy", { name: game.creatorName })}
                </p>
              </div>
            )}
            {game.timedMode && (
              <fieldset className="timed-consent">
                <legend>
                  <span>30</span>
                  {timedCopy[locale].badge}
                </legend>
                <p>{timedCopy[locale].warning}</p>
                <label htmlFor="timed-confirm-one">
                  <input
                    id="timed-confirm-one"
                    type="checkbox"
                    checked={timedConsentOne}
                    onChange={(event) =>
                      setTimedConsentOne(event.target.checked)
                    }
                  />
                  <span>{timedCopy[locale].confirmOne}</span>
                </label>
                <label htmlFor="timed-confirm-two">
                  <input
                    id="timed-confirm-two"
                    type="checkbox"
                    checked={timedConsentTwo}
                    onChange={(event) =>
                      setTimedConsentTwo(event.target.checked)
                    }
                  />
                  <span>{timedCopy[locale].confirmTwo}</span>
                </label>
              </fieldset>
            )}
            <label htmlFor="respondent">{flow(locale, "who")}</label>
            <input
              id="respondent"
              required
              minLength={1}
              maxLength={40}
              autoComplete="name"
              aria-describedby="respondent-name-rule"
              value={respondentName}
              onChange={(event) =>
                setRespondentName(event.target.value.slice(0, 40))
              }
              placeholder={flow(locale, "name")}
            />
            <small
              id="respondent-name-rule"
              className="name-rule respondent-name-rule"
            >
              {NAME_RULE_COPY[locale]}
            </small>
            {game.level === "sinfiltro" && (
              <label className="age-check">
                <input
                  type="checkbox"
                  checked={adult}
                  onChange={(event) => setAdult(event.target.checked)}
                />
                <span>{flow(locale, "adult")}</span>
              </label>
            )}
            <button
              className="primary"
              disabled={
                respondentName.trim().length < 1 ||
                (game.level === "sinfiltro" && !adult) ||
                (game.timedMode && (!timedConsentOne || !timedConsentTwo))
              }
              onClick={() => {
                setQuestionSeconds(QUESTION_TIME_LIMIT_SECONDS);
                setPhase("questions");
              }}
            >
              {flow(locale, "start")} <span>→</span>
            </button>
            <button
              type="button"
              className="report-link"
              disabled={reportSent}
              onClick={reportInvitation}
            >
              {reportSent ? reportCopy[locale].sent : reportCopy[locale].button}
            </button>
          </div>
          {!game.premium && <Sponsor compact placement="invitation" />}
        </section>
      </main>
    );

  const last = index === game.questions.length - 1;
  return (
    <main className={`question-page pack-${game.packSlug}`}>
      <div className="question-top">
        <span className="mini-brand">Z4SK</span>
        <span className={`countdown-mini ${game.timedMode ? "timed" : ""}`}>
          {game.timedMode
            ? `${timedCopy[locale].badge} · ${questionSeconds}s`
            : `${expiryCopy[locale]} ${countdown(game.expiresAt, now)}`}
        </span>
        <span>{respondentName}</span>
      </div>
      <progress
        className="question-progress"
        max={game.questions.length}
        value={index + 1}
        aria-label={`${flow(locale, "question")} ${index + 1} / ${game.questions.length}`}
      />
      <section className="question-stage">
        <div className="question-number">
          {flow(locale, "question")} {String(index + 1).padStart(2, "0")} /{" "}
          {String(game.questions.length).padStart(2, "0")}
        </div>
        {game.timedMode && (
          <div
            className={`question-timer ${questionSeconds <= 5 ? "urgent" : ""}`}
            role="timer"
            aria-live={questionSeconds <= 5 ? "polite" : "off"}
          >
            <span>{timedCopy[locale].seconds}</span>
            <b>{questionSeconds}</b>
            <progress
              max={QUESTION_TIME_LIMIT_SECONDS}
              value={questionSeconds}
              aria-label={`${timedCopy[locale].seconds}: ${questionSeconds}`}
            />
          </div>
        )}
        <div className="quote">“</div>
        <h1>{game.questions[index]}</h1>
        <div className="quick-reactions">
          <span className="emoji-picker-label">{emojiPickerLabel[locale]}</span>
          {emojiSets[game.level].map((emoji) => (
            <button
              type="button"
              key={emoji}
              className={reactions[index] === emoji ? "active" : ""}
              aria-label={`${emojiPickerLabel[locale]}: ${emoji}`}
              aria-pressed={reactions[index] === emoji}
              title={`${emojiPickerLabel[locale]}: ${emoji}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <textarea
          ref={answerRef}
          aria-label={flow(locale, "answer")}
          value={answers[index]}
          onChange={(event) =>
            setAnswers((current) =>
              current.map((value, answerIndex) =>
                answerIndex === index
                  ? event.target.value.slice(0, 800)
                  : value,
              ),
            )
          }
          placeholder={flow(locale, "answer")}
        />
        <div className="answer-count">{answers[index].length}/800</div>
        {message && <p className="form-error">{message}</p>}
        <div className={`question-actions ${game.timedMode ? "timed" : ""}`}>
          {!game.timedMode && (
            <button
              className="secondary"
              disabled={index === 0}
              onClick={() => setIndex((value) => value - 1)}
            >
              ← {flow(locale, "previous")}
            </button>
          )}
          <button
            className="primary"
            disabled={!answers[index].trim() || phase === "sending"}
            onClick={() => (last ? submit() : advanceQuestion())}
          >
            {phase === "sending"
              ? flow(locale, "sending")
              : last
                ? flow(locale, "send")
                : flow(locale, "next")}
            <span>→</span>
          </button>
        </div>
        <small className="answer-privacy">◆ {flow(locale, "encrypted")}</small>
      </section>
    </main>
  );
}
