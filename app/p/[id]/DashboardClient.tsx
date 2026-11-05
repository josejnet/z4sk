"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sponsor, TopNav } from "../../components/Brand";
import { SharedKeyUnlock } from "../../components/SharedKeyUnlock";
import type {
  Game,
  GameResponse,
  GameWire,
  StoredEncryptedResponse,
} from "../../lib/types";
import type { Locale } from "../../lib/i18n";
import { useLanguage } from "../../lib/i18n";
import { flow } from "../../lib/flow-copy";
import { TOO_LATE_COPY } from "../../lib/too-late-copy";
import {
  decryptPrivateResponse,
  verifyPrivateDecryptionKey,
} from "../../lib/response-crypto";
import {
  attachInvitationSecret,
  decryptPrivateInvitation,
  hydrateGameWire,
  isEncryptedGameWire,
} from "../../lib/invitation-crypto";
import type { EncryptedInvitationEnvelope } from "../../lib/encryption-types";
import styles from "./DashboardClient.module.css";

type DashboardData = { game: Game; responses: GameResponse[]; sealed: boolean };
type DashboardWireData = {
  game: GameWire;
  responses: StoredEncryptedResponse[];
  sealed: boolean;
};
class DashboardFetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
async function fetchDashboard(
  id: string,
  secret: string,
  privateSecret: string,
  invitationSecret: string,
  sharedKey: string,
) {
  const response = await fetch(`/api/games/${id}/responses`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${secret}` },
  });
  const result = (await response.json()) as DashboardWireData & {
    error?: string;
  };
  if (!response.ok)
    throw new DashboardFetchError(
      result.error || "Dashboard unavailable",
      response.status,
    );
  return decryptDashboard(
    result,
    privateSecret,
    invitationSecret,
    sharedKey,
  );
}

async function fetchDashboardWire(id: string, secret: string) {
  const response = await fetch(`/api/games/${id}/responses`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${secret}` },
  });
  const result = (await response.json()) as DashboardWireData & {
    error?: string;
  };
  if (!response.ok)
    throw new DashboardFetchError(
      result.error || "Dashboard unavailable",
      response.status,
    );
  return result;
}

async function decryptDashboard(
  result: DashboardWireData,
  privateSecret: string,
  invitationSecret: string,
  sharedKey: string,
) {
  if (!isEncryptedGameWire(result.game))
    throw new Error("Unsupported legacy invitation.");
  const game = await hydrateGameWire(result.game, invitationSecret, sharedKey);
  await verifyPrivateDecryptionKey(game.encryptionPublicKey, privateSecret);
  const responses = await Promise.all(
    result.responses.map(async (stored) => {
      const decrypted = await decryptPrivateResponse(
        stored.encryptedPayload,
        game.encryptionPublicKey,
        privateSecret,
      );
      if (
        decrypted.answers.length !== game.questions.length ||
        decrypted.reactions.length !== game.questions.length
      )
        throw new Error("Encrypted response shape mismatch.");
      return {
        id: stored.id,
        respondentName: decrypted.respondentName,
        answers: decrypted.answers,
        reactions: decrypted.reactions,
        createdAt: stored.createdAt,
      } satisfies GameResponse;
    }),
  );
  return { game, responses, sealed: result.sealed } satisfies DashboardData;
}
function formatDate(value: string, locale: Locale) {
  const map: Record<Locale, string> = {
    en: "en-US",
    es: "es-ES",
    it: "it-IT",
    fr: "fr-FR",
    de: "de-DE",
    nl: "nl-NL",
    eo: "eo",
    pt: "pt-PT",
    zh: "zh-CN",
    hi: "hi-IN",
    ja: "ja-JP",
    tr: "tr-TR",
    machine: "en-US",
  };
  return new Intl.DateTimeFormat(map[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
const cancelLabel: Record<Locale, string> = {
  en: "Cancel",
  es: "Cancelar",
  it: "Annulla",
  fr: "Annuler",
  de: "Abbrechen",
  nl: "Annuleren",
  eo: "Nuligi",
  pt: "Cancelar",
  zh: "取消",
  hi: "रद्द करें",
  ja: "キャンセル",
  tr: "İptal",
  machine: "ABORT",
};
const closeRevealLabel: Record<Locale, string> = {
  en: "Close and destroy this view",
  es: "Cerrar y destruir esta vista",
  it: "Chiudi e distruggi questa vista",
  fr: "Fermer et détruire cette vue",
  de: "Diese Ansicht schließen und vernichten",
  nl: "Deze weergave sluiten en vernietigen",
  eo: "Fermi kaj detrui ĉi tiun vidon",
  pt: "Fechar e destruir esta vista",
  zh: "关闭并销毁此视图",
  hi: "इस दृश्य को बंद करके मिटाएँ",
  ja: "この画面を閉じて破棄",
  tr: "Bu görünümü kapat ve yok et",
  machine: "CLOSE_AND_DESTROY_VIEW",
};
const decryptionLabel: Record<Locale, string> = {
  en: "Decrypted only in this browser with the private key from your link.",
  es: "Descifrado únicamente en este navegador con la clave privada de tu enlace.",
  it: "Decifrato solo in questo browser con la chiave privata del link.",
  fr: "Déchiffré uniquement dans ce navigateur avec la clé privée du lien.",
  de: "Nur in diesem Browser mit dem privaten Schlüssel aus deinem Link entschlüsselt.",
  nl: "Alleen in deze browser ontsleuteld met de privésleutel uit je link.",
  eo: "Deĉifrita nur en ĉi tiu retumilo per la privata ŝlosilo el via ligilo.",
  pt: "Decifrado apenas neste navegador com a chave privada do teu link.",
  zh: "仅使用链接中的私钥在此浏览器中解密。",
  hi: "सिर्फ इस ब्राउज़र में आपके लिंक की निजी कुंजी से डिक्रिप्ट किया गया।",
  ja: "リンク内の秘密鍵を使い、このブラウザ内だけで復号します。",
  tr: "Yalnızca bağlantındaki özel anahtarla bu tarayıcıda çözülür.",
  machine: "decrypt.location=browser_only; private_key.source=url_fragment",
};
const dashboardUi: Record<
  Locale,
  {
    missing: string;
    loadError: string;
    opened: string;
    alertsOn: string;
    enableAlerts: string;
    openedNotification: string;
  }
> = {
  en: {
    missing: "Missing secret dashboard key.",
    loadError: "Could not open the dashboard.",
    opened: "Opened",
    alertsOn: "Alerts on",
    enableAlerts: "Enable alerts",
    openedNotification: "{name} opened your invitation.",
  },
  es: {
    missing: "Falta la clave secreta del panel.",
    loadError: "No se pudo abrir el panel.",
    opened: "Abierta",
    alertsOn: "Avisos activos",
    enableAlerts: "Activar avisos",
    openedNotification: "{name} ha abierto tu invitación.",
  },
  it: {
    missing: "Manca la chiave segreta del pannello.",
    loadError: "Impossibile aprire il pannello.",
    opened: "Aperto",
    alertsOn: "Avvisi attivi",
    enableAlerts: "Attiva avvisi",
    openedNotification: "{name} ha aperto il tuo invito.",
  },
  fr: {
    missing: "La clé secrète de l’espace est absente.",
    loadError: "Impossible d’ouvrir l’espace.",
    opened: "Ouvert",
    alertsOn: "Alertes actives",
    enableAlerts: "Activer les alertes",
    openedNotification: "{name} a ouvert votre invitation.",
  },
  de: {
    missing: "Der geheime Dashboard-Schlüssel fehlt.",
    loadError: "Der Bereich konnte nicht geöffnet werden.",
    opened: "Geöffnet",
    alertsOn: "Hinweise aktiv",
    enableAlerts: "Hinweise aktivieren",
    openedNotification: "{name} hat deine Einladung geöffnet.",
  },
  nl: {
    missing: "De geheime dashboardsleutel ontbreekt.",
    loadError: "Het dashboard kon niet worden geopend.",
    opened: "Geopend",
    alertsOn: "Meldingen aan",
    enableAlerts: "Meldingen aanzetten",
    openedNotification: "{name} heeft je uitnodiging geopend.",
  },
  eo: {
    missing: "Mankas la sekreta panela ŝlosilo.",
    loadError: "Ne eblis malfermi la panelon.",
    opened: "Malfermita",
    alertsOn: "Sciigoj aktivaj",
    enableAlerts: "Aktivigi sciigojn",
    openedNotification: "{name} malfermis vian inviton.",
  },
  pt: {
    missing: "Falta a chave secreta do painel.",
    loadError: "Não foi possível abrir o painel.",
    opened: "Aberto",
    alertsOn: "Alertas ativos",
    enableAlerts: "Ativar alertas",
    openedNotification: "{name} abriu o teu convite.",
  },
  zh: {
    missing: "缺少私人面板密钥。",
    loadError: "无法打开面板。",
    opened: "已打开",
    alertsOn: "提醒已开启",
    enableAlerts: "开启提醒",
    openedNotification: "{name} 打开了你的邀请。",
  },
  hi: {
    missing: "निजी डैशबोर्ड की गुप्त कुंजी नहीं मिली।",
    loadError: "डैशबोर्ड नहीं खुल सका।",
    opened: "खोला गया",
    alertsOn: "सूचनाएँ चालू",
    enableAlerts: "सूचनाएँ चालू करें",
    openedNotification: "{name} ने आपका निमंत्रण खोला।",
  },
  ja: {
    missing: "非公開パネルの秘密鍵がありません。",
    loadError: "パネルを開けませんでした。",
    opened: "開封済み",
    alertsOn: "通知オン",
    enableAlerts: "通知を有効にする",
    openedNotification: "{name}さんが招待を開きました。",
  },
  tr: {
    missing: "Gizli panel anahtarı eksik.",
    loadError: "Panel açılamadı.",
    opened: "Açıldı",
    alertsOn: "Bildirimler açık",
    enableAlerts: "Bildirimleri aç",
    openedNotification: "{name} davetini açtı.",
  },
  machine: {
    missing: "ERR_ADMIN_KEY_MISSING",
    loadError: "ERR_DASHBOARD_OPEN",
    opened: "OPENED",
    alertsOn: "ALERTS=ON",
    enableAlerts: "ENABLE_ALERTS",
    openedNotification: "event=invitation_opened; actor={name}",
  },
};
const creatorCancellationUi: Record<
  Locale,
  { button: string; before: string; after: string }
> = {
  en: {
    button: "Cancel invitation",
    before:
      "Cancel this invitation before it is opened and permanently delete all active data?",
    after:
      "This invitation was already opened. Cancel it and permanently delete all active data? This cannot erase anything already seen or copied.",
  },
  es: {
    button: "Anular invitación",
    before:
      "¿Anular esta invitación antes de que se abra y borrar permanentemente todos los datos activos?",
    after:
      "La invitación ya se abrió. ¿Anularla y borrar todos los datos activos? Esto no puede eliminar lo que ya se haya visto o copiado.",
  },
  it: {
    button: "Annulla invito",
    before:
      "Annullare l'invito prima dell'apertura ed eliminare definitivamente tutti i dati attivi?",
    after:
      "L'invito è già stato aperto. Annullarlo ed eliminare tutti i dati attivi? Non elimina ciò che è già stato visto o copiato.",
  },
  fr: {
    button: "Annuler l’invitation",
    before:
      "Annuler cette invitation avant son ouverture et supprimer définitivement toutes les données actives ?",
    after:
      "L’invitation a déjà été ouverte. L’annuler et supprimer toutes les données actives ? Cela n’efface pas ce qui a déjà été vu ou copié.",
  },
  de: {
    button: "Einladung widerrufen",
    before:
      "Einladung vor dem Öffnen widerrufen und alle aktiven Daten endgültig löschen?",
    after:
      "Die Einladung wurde bereits geöffnet. Widerrufen und alle aktiven Daten löschen? Bereits Gesehenes oder Kopiertes kann nicht entfernt werden.",
  },
  nl: {
    button: "Uitnodiging intrekken",
    before:
      "Deze uitnodiging vóór opening intrekken en alle actieve gegevens definitief verwijderen?",
    after:
      "De uitnodiging is al geopend. Intrekken en alle actieve gegevens verwijderen? Dit wist niet wat al is gezien of gekopieerd.",
  },
  eo: {
    button: "Nuligi inviton",
    before:
      "Ĉu nuligi la inviton antaŭ malfermo kaj definitive forigi ĉiujn aktivajn datumojn?",
    after:
      "La invito jam estis malfermita. Ĉu nuligi kaj forigi ĉiujn aktivajn datumojn? Tio ne viŝas ion jam viditan aŭ kopiitan.",
  },
  pt: {
    button: "Anular convite",
    before:
      "Anular este convite antes de ser aberto e eliminar definitivamente todos os dados ativos?",
    after:
      "O convite já foi aberto. Anulá-lo e eliminar todos os dados ativos? Isto não apaga o que já foi visto ou copiado.",
  },
  zh: {
    button: "撤销邀请",
    before: "在邀请打开前撤销，并永久删除所有活动数据？",
    after:
      "邀请已经打开。仍要撤销并删除所有活动数据吗？这无法清除已查看或复制的内容。",
  },
  hi: {
    button: "निमंत्रण रद्द करें",
    before:
      "निमंत्रण खुलने से पहले रद्द करके सभी सक्रिय डेटा स्थायी रूप से मिटाएँ?",
    after:
      "निमंत्रण पहले ही खुल चुका है। इसे रद्द करके सभी सक्रिय डेटा मिटाएँ? पहले से देखा या कॉपी किया गया डेटा नहीं मिटेगा।",
  },
  ja: {
    button: "招待を取り消す",
    before:
      "開かれる前に招待を取り消し、有効なデータをすべて完全に削除しますか？",
    after:
      "招待はすでに開かれています。取り消して有効なデータをすべて削除しますか？すでに見た・コピーした内容は消せません。",
  },
  tr: {
    button: "Daveti iptal et",
    before:
      "Davet açılmadan iptal edilip tüm etkin veriler kalıcı olarak silinsin mi?",
    after:
      "Davet zaten açılmış. İptal edilip tüm etkin veriler silinsin mi? Daha önce görülen veya kopyalananlar silinemez.",
  },
  machine: {
    button: "CANCEL invitation",
    before: "CONFIRM cancel_before_open AND DELETE active_data",
    after:
      "opened=true; CONFIRM cancel AND DELETE active_data; erase_seen_or_copied=false",
  },
};

export function DashboardClient({ id }: { id: string }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [invitationKey, setInvitationKey] = useState("");
  const [sharedKey, setSharedKey] = useState("");
  const [pendingWire, setPendingWire] = useState<DashboardWireData | null>(
    null,
  );
  const { locale: preferredLocale, setLocale } = useLanguage();
  const locale = preferredLocale;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<{
    questions: string[];
    response: GameResponse;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [confirmRevealOpen, setConfirmRevealOpen] = useState(false);
  const [tooLate, setTooLate] = useState(false);
  const initialLoadRef = useRef(false);
  const dashboardUnlocked = Boolean(data);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const secret = fragment.get("key") || "";
    const decryptionSecret = fragment.get("decrypt") || "";
    const invitationSecret = fragment.get("invite") || "";
    let active = true;
    if (!secret || !decryptionSecret) {
      queueMicrotask(() => {
        if (active) {
          setError(dashboardUi.en.missing);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }
    void fetchDashboardWire(id, secret)
      .then(async (result) => {
        if (active) {
          setKey(secret);
          setPrivateKey(decryptionSecret);
          setInvitationKey(invitationSecret);
          if (
            isEncryptedGameWire(result.game) &&
            result.game.encryptedInvitation.keyMode === "link"
          ) {
            const decrypted = await decryptDashboard(
              result,
              decryptionSecret,
              invitationSecret,
              "",
            );
            if (!active) return;
            setData(decrypted);
            setLocale(decrypted.game.locale);
          } else {
            setPendingWire(result);
          }
        }
      })
      .catch((cause) => {
        if (active) {
          const late =
            cause instanceof DashboardFetchError &&
            [404, 410].includes(cause.status);
          setTooLate(late);
          setError(
            late
              ? TOO_LATE_COPY[preferredLocale].answers
              : dashboardUi[preferredLocale].loadError,
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, preferredLocale, setLocale]);
  useEffect(() => {
    if (!key || !privateKey || !dashboardUnlocked) return;
    const timer = window.setInterval(() => {
      void fetchDashboard(
        id,
        key,
        privateKey,
        invitationKey,
        sharedKey,
      )
        .then((result) => {
          setData((current) => {
            if (
              current &&
              !current.game.openedAt &&
              result.game.openedAt &&
              Notification.permission === "granted"
            )
              new Notification("Z4SK", {
                body: dashboardUi[
                  result.game.locale
                ].openedNotification.replace(
                  "{name}",
                  result.game.recipientName,
                ),
              });
            return result;
          });
        })
        .catch(() => {
          /* The manual refresh surface reports errors. */
        });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [
    dashboardUnlocked,
    id,
    invitationKey,
    key,
    privateKey,
    sharedKey,
  ]);

  async function unlockDashboard(nextSharedKey: string) {
    if (!pendingWire) throw new Error("No pending dashboard.");
    try {
      const result = await decryptDashboard(
        pendingWire,
        privateKey,
        invitationKey,
        nextSharedKey,
      );
      setSharedKey(nextSharedKey);
      setPendingWire(null);
      setData(result);
      setLocale(result.game.locale);
    } catch {
      throw new Error(dashboardUi[preferredLocale].loadError);
    }
  }

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await fetchDashboard(
        id,
        key,
        privateKey,
        invitationKey,
        sharedKey,
      );
      setData(result);
      setLocale(result.game.locale);
    } catch (cause) {
      const late =
        cause instanceof DashboardFetchError &&
        [404, 410].includes(cause.status);
      setTooLate(late);
      setError(
        late ? TOO_LATE_COPY[locale].answers : dashboardUi[locale].loadError,
      );
      if (late) setData(null);
    } finally {
      setLoading(false);
    }
  }
  async function revealOnce() {
    setConfirmRevealOpen(false);
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/games/${id}/consume`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}` },
      });
      const result = (await response.json()) as
        | {
            encryptedInvitation: EncryptedInvitationEnvelope;
            questionCount: number;
            response: StoredEncryptedResponse;
            error?: string;
          }
        | {
            questions: string[];
            encryptionPublicKey: Game["encryptionPublicKey"];
            response: StoredEncryptedResponse;
            error?: string;
          };
      if (!response.ok) throw new Error(result.error);
      let questions: string[];
      let encryptionPublicKey: Game["encryptionPublicKey"];
      if ("encryptedInvitation" in result) {
        const invitation = await decryptPrivateInvitation(
          result.encryptedInvitation,
          invitationKey,
          sharedKey,
        );
        questions = invitation.questions;
        encryptionPublicKey = invitation.encryptionPublicKey;
        if (questions.length !== result.questionCount)
          throw new Error(dashboardUi[locale].loadError);
      } else {
        questions = result.questions;
        encryptionPublicKey = result.encryptionPublicKey;
      }
      const decrypted = await decryptPrivateResponse(
        result.response.encryptedPayload,
        encryptionPublicKey,
        privateKey,
      );
      if (
        decrypted.answers.length !== questions.length ||
        decrypted.reactions.length !== questions.length
      )
        throw new Error(dashboardUi[locale].loadError);
      setRevealed({
        questions,
        response: {
          id: result.response.id,
          respondentName: decrypted.respondentName,
          answers: decrypted.answers,
          reactions: decrypted.reactions,
          createdAt: result.response.createdAt,
        },
      });
      setData(null);
      history.replaceState({}, "", `/p/${id}`);
      setKey("");
      setPrivateKey("");
      setInvitationKey("");
      setSharedKey("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : flow(locale, "panelError"),
      );
    } finally {
      setLoading(false);
    }
  }
  async function copyShare() {
    if (!data) return;
    const url = attachInvitationSecret(
      `${window.location.origin}/g/${id}`,
      invitationKey,
    );
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifications(permission === "granted");
  }
  async function remove() {
    if (!data) return;
    const cancellation = creatorCancellationUi[locale];
    if (!confirm(data.game.openedAt ? cancellation.after : cancellation.before))
      return;
    const response = await fetch(`/api/games/${id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${key}` },
    });
    if (response.ok) router.push("/");
  }
  function closeRevealed() {
    setRevealed(null);
    window.location.replace("/");
  }

  if (loading)
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className="center-state">
          <div className="loader" />
          <p>{flow(locale, "panelLoading")}</p>
        </div>
      </main>
    );
  if (revealed)
    return (
      <main className="dashboard-page">
        <TopNav minimal />
        <section className="revealed-head">
          <span className="eyebrow">{flow(locale, "onceDeleted")}</span>
          <h1>{flow(locale, "onlyRead")}</h1>
          <p>{flow(locale, "dontClose")}</p>
        </section>
        <section className="responses-wrap">
          <ResponseCard
            response={revealed.response}
            questions={revealed.questions}
            locale={locale}
            once
          />
          <button
            type="button"
            className="close-revealed-button"
            onClick={closeRevealed}
          >
            <span aria-hidden="true">×</span>
            {closeRevealLabel[locale]}
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>
    );
  if (pendingWire)
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className="shared-key-unlock-page">
          <SharedKeyUnlock locale={preferredLocale} onKey={unlockDashboard} />
        </div>
      </main>
    );
  if (error || !data)
    return (
      <main className="experience-page">
        <TopNav minimal />
        <div className={`center-state ${tooLate ? "too-late-state" : ""}`}>
          <span className="large-symbol" aria-hidden="true">
            {tooLate ? "⌛" : "◆"}
          </span>
          <h1>
            {tooLate ? TOO_LATE_COPY[locale].title : flow(locale, "panelError")}
          </h1>
          <p>{tooLate ? TOO_LATE_COPY[locale].answers : error}</p>
          {/* A hard navigation keeps recovery available if the client router fails. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className={styles.backHomeLink} href="/" target="_top">
            <span aria-hidden="true">←</span>
            {flow(locale, "home")}
          </a>
        </div>
      </main>
    );

  const count = data.game.responseCount || 0;
  return (
    <>
      <main className="dashboard-page">
        <TopNav minimal />
        <header className="dashboard-head">
          <div>
            <span className="eyebrow">
              {flow(locale, "panelOf", {
                name: data.game.creatorName.toUpperCase(),
              })}
            </span>
            <h1>
              {flow(locale, "answersFor")}
              <br />
              <em>{data.game.recipientName}.</em>
            </h1>
            <p>
              ◆ {flow(locale, "secret")}{" "}
              {data.game.openedAt
                ? `· ${dashboardUi[locale].opened} ${formatDate(data.game.openedAt, locale)}`
                : ""}
            </p>
            <p className="dashboard-decryption">✓ {decryptionLabel[locale]}</p>
          </div>
          <div className="dashboard-stat">
            <strong>{count}</strong>
            <span>{flow(locale, count === 1 ? "response" : "responses")}</span>
          </div>
        </header>
        <div className="dashboard-toolbar">
          <button onClick={copyShare}>
            {copied ? flow(locale, "linkCopied") : flow(locale, "copyAnswer")}
          </button>
          <button onClick={refresh}>{flow(locale, "refresh")}</button>
          <button onClick={enableNotifications}>
            {notifications
              ? `✓ ${dashboardUi[locale].alertsOn}`
              : dashboardUi[locale].enableAlerts}
          </button>
          <button className="danger-link" onClick={remove}>
            {creatorCancellationUi[locale].button}
          </button>
        </div>
        {data.game.viewOnce ? (
          <section className="sealed-wrap">
            {data.sealed ? (
              <div className="sealed-card">
                <div className="sealed-orbit">
                  <span>◆</span>
                </div>
                <span className="eyebrow">{flow(locale, "sealed")}</span>
                <h2>{flow(locale, "someone")}</h2>
                <p>{flow(locale, "sealedCopy")}</p>
                <button
                  className="destruct-button"
                  onClick={() => setConfirmRevealOpen(true)}
                >
                  {flow(locale, "destroy")} <span>→</span>
                </button>
                <small>{flow(locale, "irreversible")}</small>
              </div>
            ) : (
              <EmptyState once locale={locale} onCopy={copyShare} />
            )}
          </section>
        ) : (
          <section className="responses-wrap">
            {data.responses.length ? (
              data.responses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  questions={data.game.questions}
                  locale={locale}
                />
              ))
            ) : (
              <EmptyState locale={locale} onCopy={copyShare} />
            )}
          </section>
        )}
        {!data.game.premium && (
          <div className="dashboard-ad">
            <Sponsor compact placement="dashboard" />
          </div>
        )}
      </main>
      {confirmRevealOpen && (
        <RevealConfirm
          locale={locale}
          onCancel={() => setConfirmRevealOpen(false)}
          onConfirm={revealOnce}
        />
      )}
    </>
  );
}

function RevealConfirm({
  locale,
  onCancel,
  onConfirm,
}: {
  locale: Locale;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="destructive-dialog-backdrop">
      <section
        className="destructive-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reveal-dialog-title"
        aria-describedby="reveal-dialog-copy"
      >
        <div className="destructive-dialog-icon">!</div>
        <span className="eyebrow">{flow(locale, "sealed")}</span>
        <h2 id="reveal-dialog-title">{flow(locale, "onlyRead")}</h2>
        <p id="reveal-dialog-copy">{flow(locale, "confirmReveal")}</p>
        <div className="destructive-warnings">
          <p>
            <b>01</b>
            {flow(locale, "irreversible")}
          </p>
          <p>
            <b>02</b>
            {flow(locale, "dontClose")}
          </p>
        </div>
        <div className="destructive-dialog-actions">
          <button type="button" className="dialog-cancel" onClick={onCancel}>
            ← {cancelLabel[locale]}
          </button>
          <button type="button" className="dialog-confirm" onClick={onConfirm}>
            {flow(locale, "destroy")} <span>→</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  locale,
  once = false,
  onCopy,
}: {
  locale: Locale;
  once?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="empty-responses">
      <span>○</span>
      <h2>{flow(locale, "silent")}</h2>
      <p>{flow(locale, once ? "silentOnce" : "silentNormal")}</p>
      <button onClick={onCopy}>{flow(locale, "copyLink")}</button>
    </div>
  );
}
function ResponseCard({
  response,
  questions,
  locale,
  once = false,
}: {
  response: GameResponse;
  questions: string[];
  locale: Locale;
  once?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <article className={`response-card ${open ? "open" : ""}`}>
      <button
        className="response-header"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="avatar">
          {response.respondentName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2>{response.respondentName}</h2>
          <span>{formatDate(response.createdAt, locale)}</span>
        </div>
        <em>
          {once
            ? flow(locale, "onceDeleted")
            : open
              ? flow(locale, "hide")
              : flow(locale, "viewAnswers")}
        </em>
      </button>
      {open && (
        <div className="answers">
          {questions.map((question, index) => (
            <div key={question}>
              <span>
                {response.reactions?.[index] ||
                  String(index + 1).padStart(2, "0")}
              </span>
              <section>
                <h3>{question}</h3>
                <p>{response.answers[index]}</p>
              </section>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
