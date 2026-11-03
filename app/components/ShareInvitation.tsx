"use client";

import { useEffect, useState } from "react";
import { interpolate, type Locale } from "../lib/i18n";
import { SHARED_KEY_COPY } from "../lib/shared-key-copy";

type Copy = {
  title: string;
  hint: string;
  keyStep: string;
  answerStep: string;
  native: string;
  whatsapp: string;
  whatsappWeb: string;
  email: string;
  gmail: string;
  outlook: string;
  yahoo: string;
  subject: string;
};
const copy: Record<Locale, Copy> = {
  en: {
    title: "1 · Send the answer link or invitation QR",
    hint: "The link and the invitation QR are the same access: send either one. Never share your private dashboard link.",
    keyStep: "2 · Because you enabled the optional key, send its QR or recovery phrase separately—not together with the invitation.",
    answerStep: "The recipient answers and the encrypted responses appear only in your private dashboard.",
    native: "Share with another app",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "Email app",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "I left you some private questions on Z4SK",
  },
  es: {
    title: "1 · Envía el enlace o el QR de invitación",
    hint: "El enlace y el QR de invitación dan el mismo acceso para responder: basta con enviar uno. Nunca compartas el enlace de tu panel privado.",
    keyStep: "2 · Como activaste la llave opcional, envía su QR o frase de recuperación por separado; nunca junto a la invitación.",
    answerStep: "La persona responde y las respuestas cifradas aparecen únicamente en tu panel privado.",
    native: "Compartir con otra aplicación",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "Aplicación de correo",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Te he dejado unas preguntas privadas en Z4SK",
  },
  it: {
    title: "1 · Invia il link o il QR dell'invito",
    hint: "Link e QR dell'invito danno lo stesso accesso: inviane uno solo. Non condividere mai il link del pannello privato.",
    keyStep: "2 · Poiché hai attivato la chiave opzionale, invia il suo QR o la frase di recupero separatamente dall'invito.",
    answerStep: "La persona risponde e le risposte cifrate compaiono solo nel tuo pannello privato.",
    native: "Condividi con un'altra app",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "App e-mail",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Ti ho lasciato alcune domande private su Z4SK",
  },
  fr: {
    title: "1 · Envoyez le lien ou le QR d'invitation",
    hint: "Le lien et le QR d'invitation donnent le même accès : envoyez l'un des deux. Ne partagez jamais le lien de votre espace privé.",
    keyStep: "2 · La clé facultative étant activée, envoyez son QR ou sa phrase de récupération séparément de l'invitation.",
    answerStep: "La personne répond et les réponses chiffrées apparaissent uniquement dans votre espace privé.",
    native: "Partager avec une autre application",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "Application e-mail",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Je vous ai laissé quelques questions privées sur Z4SK",
  },
  de: {
    title: "1 · Einladungslink oder -QR senden",
    hint: "Link und Einladungs-QR gewähren denselben Zugang: Sende nur einen davon. Teile nie den Link deines privaten Bereichs.",
    keyStep: "2 · Da der optionale Schlüssel aktiv ist, sende seinen QR oder die Wiederherstellungsphrase getrennt von der Einladung.",
    answerStep: "Die Person antwortet; verschlüsselte Antworten erscheinen nur in deinem privaten Bereich.",
    native: "Mit einer anderen App teilen",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "E-Mail-App",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Ich habe dir private Fragen auf Z4SK hinterlassen",
  },
  nl: {
    title: "1 · Stuur de link of uitnodigings-QR",
    hint: "De link en uitnodigings-QR geven dezelfde toegang: stuur er één. Deel nooit de link van je privédashboard.",
    keyStep: "2 · Omdat de optionele sleutel actief is, stuur je de QR of herstelzin apart van de uitnodiging.",
    answerStep: "De ontvanger antwoordt; versleutelde antwoorden verschijnen alleen in je privédashboard.",
    native: "Delen met een andere app",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "E-mailapp",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Ik heb privévragen voor je achtergelaten op Z4SK",
  },
  eo: {
    title: "1 · Sendu la ligilon aŭ invitan QR",
    hint: "La ligilo kaj invita QR donas la saman aliron: sendu nur unu. Neniam kundividu la ligilon de via privata panelo.",
    keyStep: "2 · Ĉar la nedeviga ŝlosilo estas aktiva, sendu ĝian QR aŭ reakiran frazon aparte de la invito.",
    answerStep: "La ricevanto respondas kaj ĉifritaj respondoj aperas nur en via privata panelo.",
    native: "Kunhavigi per alia aplikaĵo",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "Retpoŝta aplikaĵo",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Mi lasis al vi privatajn demandojn en Z4SK",
  },
  pt: {
    title: "1 · Envia o link ou o QR do convite",
    hint: "O link e o QR do convite dão o mesmo acesso: envia apenas um. Nunca partilhes o link do painel privado.",
    keyStep: "2 · Como ativaste a chave opcional, envia o seu QR ou frase de recuperação separadamente do convite.",
    answerStep: "A pessoa responde e as respostas cifradas aparecem apenas no teu painel privado.",
    native: "Partilhar com outra aplicação",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "Aplicação de e-mail",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Deixei algumas perguntas privadas para si no Z4SK",
  },
  zh: {
    title: "1 · 发送回答链接或邀请二维码",
    hint: "链接和邀请二维码提供相同的回答入口，任选其一发送。切勿分享私人面板链接。",
    keyStep: "2 · 你启用了可选密钥，请将密钥二维码或恢复短语与邀请分开发送。",
    answerStep: "对方回答后，加密回答只会出现在你的私人面板中。",
    native: "用其他应用分享",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp 网页版",
    email: "邮件应用",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "我在 Z4SK 给你留了几个私密问题",
  },
  hi: {
    title: "1 · जवाब लिंक या निमंत्रण QR भेजें",
    hint: "लिंक और निमंत्रण QR एक ही पहुँच देते हैं: इनमें से एक भेजें। निजी डैशबोर्ड लिंक कभी साझा न करें।",
    keyStep: "2 · वैकल्पिक कुंजी चालू है, इसलिए उसका QR या रिकवरी वाक्य निमंत्रण से अलग भेजें।",
    answerStep: "प्राप्तकर्ता जवाब देता है और एन्क्रिप्टेड जवाब केवल आपके निजी डैशबोर्ड में दिखते हैं।",
    native: "किसी दूसरे ऐप से साझा करें",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "ईमेल ऐप",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "मैंने Z4SK पर आपके लिए कुछ निजी सवाल छोड़े हैं",
  },
  ja: {
    title: "1 · 回答リンクまたは招待QRを送る",
    hint: "リンクと招待QRは同じ回答画面を開きます。どちらか一方を送り、非公開パネルのリンクは共有しないでください。",
    keyStep: "2 · 任意の鍵を有効にしたため、鍵QRまたは復元フレーズを招待とは別に送ってください。",
    answerStep: "相手が回答すると、暗号化された回答はあなたの非公開パネルだけに表示されます。",
    native: "別のアプリで共有",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "メールアプリ",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Z4SKにあなたへのプライベートな質問を残しました",
  },
  tr: {
    title: "1 · Yanıt bağlantısını veya davet QR'ını gönder",
    hint: "Bağlantı ve davet QR'ı aynı erişimi sağlar: birini gönder. Özel panel bağlantını asla paylaşma.",
    keyStep: "2 · İsteğe bağlı anahtarı etkinleştirdiğin için QR'ını veya kurtarma ifadesini davetten ayrı gönder.",
    answerStep: "Alıcı yanıtlar; şifreli yanıtlar yalnızca özel panelinde görünür.",
    native: "Başka bir uygulamayla paylaş",
    whatsapp: "WhatsApp",
    whatsappWeb: "WhatsApp Web",
    email: "E-posta uygulaması",
    gmail: "Gmail",
    outlook: "Outlook",
    yahoo: "Yahoo Mail",
    subject: "Z4SK'te sana birkaç özel soru bıraktım",
  },
  machine: {
    title: "1::SHARE invitation_url OR invitation_qr",
    hint: "invitation_url==invitation_qr.payload; choose_one; adminUrl=NEVER_SHARE",
    keyStep: "2::IF shared_key THEN SEND key_qr|recovery_phrase VIA separate_channel",
    answerStep: "respondent.submit(); ciphertext.visible_at=creator_dashboard_only",
    native: "navigator.share()",
    whatsapp: "whatsapp://",
    whatsappWeb: "web.whatsapp",
    email: "mailto:",
    gmail: "gmail.compose",
    outlook: "outlook.compose",
    yahoo: "yahoo.compose",
    subject: "Z4SK_PRIVATE_QUESTIONS",
  },
};

export function ShareInvitation({
  locale,
  recipientName,
  playUrl,
  shareText,
  protectedBySharedKey,
}: {
  locale: Locale;
  recipientName: string;
  playUrl: string;
  shareText: string;
  protectedBySharedKey: boolean;
}) {
  const [nativeShare, setNativeShare] = useState(false);
  const c = copy[locale];
  const message = `${interpolate(shareText, { name: recipientName })}\n\n${playUrl}`;

  useEffect(() => {
    queueMicrotask(() => setNativeShare(typeof navigator.share === "function"));
  }, []);

  function open(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function shareWhatsapp() {
    open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  }
  function shareEmail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(message)}`;
  }
  function shareWebmail(provider: "gmail" | "outlook" | "yahoo") {
    const subject = encodeURIComponent(c.subject);
    const body = encodeURIComponent(message);
    const urls = {
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      outlook: `https://outlook.office.com/mail/deeplink/compose?subject=${subject}&body=${body}`,
      yahoo: `https://compose.mail.yahoo.com/?subject=${subject}&body=${body}`,
    };
    open(urls[provider]);
  }
  async function shareNative() {
    try {
      await navigator.share({
        title: c.subject,
        text: interpolate(shareText, { name: recipientName }),
        url: playUrl,
      });
    } catch {
      /* Closing the operating-system share sheet is not an error. */
    }
  }

  return (
    <section
      className="invitation-share"
      aria-labelledby="invitation-share-title"
    >
      <div className="share-heading">
        <span>↗</span>
        <div>
          <h4 id="invitation-share-title">{c.title}</h4>
          <p>{c.hint}</p>
        </div>
      </div>
      {protectedBySharedKey && (
        <p className="share-password-warning">
          <b>!</b>
          {SHARED_KEY_COPY[locale].differentChannel}
        </p>
      )}
      <ol className="share-flow">
        {protectedBySharedKey && <li>{c.keyStep}</li>}
        <li>
          {protectedBySharedKey ? "3 · " : "2 · "}
          {c.answerStep}
        </li>
      </ol>
      <div className="share-primary">
        {nativeShare && (
          <button type="button" className="share-native" onClick={shareNative}>
            <i>↗</i>
            {c.native}
          </button>
        )}
        <button
          type="button"
          className="share-whatsapp"
          onClick={shareWhatsapp}
        >
          <i>WA</i>
          <span className="mobile-share-label">{c.whatsapp}</span>
          <span className="desktop-share-label">{c.whatsappWeb}</span>
        </button>
        <button type="button" onClick={shareEmail}>
          <i>@</i>
          {c.email}
        </button>
      </div>
      <div className="share-webmail" role="group" aria-label={c.email}>
        <button type="button" onClick={() => shareWebmail("gmail")}>
          <i>G</i>
          {c.gmail}
        </button>
        <button type="button" onClick={() => shareWebmail("outlook")}>
          <i>O</i>
          {c.outlook}
        </button>
        <button type="button" onClick={() => shareWebmail("yahoo")}>
          <i>Y</i>
          {c.yahoo}
        </button>
      </div>
    </section>
  );
}
