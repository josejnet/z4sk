"use client";

import { useEffect, useState } from "react";
import { interpolate, type Locale } from "../lib/i18n";

type Copy = { title: string; hint: string; native: string; whatsapp: string; whatsappWeb: string; email: string; gmail: string; outlook: string; yahoo: string; subject: string };
const copy: Record<Locale, Copy> = {
  en: { title: "Send the invitation", hint: "Only the answer link is shared. Your private dashboard stays secret.", native: "Share with another app", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "Email app", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "I left you some private questions on Z4SK" },
  es: { title: "Envía la invitación", hint: "Solo se comparte el enlace para responder. Tu panel privado sigue siendo secreto.", native: "Compartir con otra aplicación", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "Aplicación de correo", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Te he dejado unas preguntas privadas en Z4SK" },
  it: { title: "Invia l'invito", hint: "Viene condiviso solo il link per rispondere. Il pannello privato resta segreto.", native: "Condividi con un'altra app", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "App e-mail", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Ti ho lasciato alcune domande private su Z4SK" },
  fr: { title: "Envoyez l'invitation", hint: "Seul le lien de réponse est partagé. Votre espace privé reste secret.", native: "Partager avec une autre application", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "Application e-mail", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Je vous ai laissé quelques questions privées sur Z4SK" },
  de: { title: "Einladung senden", hint: "Nur der Antwort-Link wird geteilt. Dein privates Dashboard bleibt geheim.", native: "Mit einer anderen App teilen", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "E-Mail-App", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Ich habe dir private Fragen auf Z4SK hinterlassen" },
  nl: { title: "Stuur de uitnodiging", hint: "Alleen de antwoordlink wordt gedeeld. Je privédashboard blijft geheim.", native: "Delen met een andere app", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "E-mailapp", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Ik heb privévragen voor je achtergelaten op Z4SK" },
  eo: { title: "Sendu la inviton", hint: "Nur la responda ligilo estas kundividata. Via privata panelo restas sekreta.", native: "Kunhavigi per alia aplikaĵo", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "Retpoŝta aplikaĵo", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Mi lasis al vi privatajn demandojn en Z4SK" },
  pt: { title: "Envie o convite", hint: "Só o link para responder é partilhado. O seu painel privado continua secreto.", native: "Partilhar com outra aplicação", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "Aplicação de e-mail", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Deixei algumas perguntas privadas para si no Z4SK" },
  zh: { title: "发送邀请", hint: "只会分享回答链接，你的私人面板仍然保密。", native: "用其他应用分享", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp 网页版", email: "邮件应用", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "我在 Z4SK 给你留了几个私密问题" },
  hi: { title: "निमंत्रण भेजें", hint: "सिर्फ जवाब देने वाला लिंक साझा होगा। आपका निजी डैशबोर्ड गुप्त रहेगा।", native: "किसी दूसरे ऐप से साझा करें", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "ईमेल ऐप", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "मैंने Z4SK पर आपके लिए कुछ निजी सवाल छोड़े हैं" },
  ja: { title: "招待を送る", hint: "回答用リンクだけを共有します。非公開ダッシュボードは秘密のままです。", native: "別のアプリで共有", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "メールアプリ", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Z4SKにあなたへのプライベートな質問を残しました" },
  tr: { title: "Daveti gönder", hint: "Yalnızca yanıt bağlantısı paylaşılır. Özel panelin gizli kalır.", native: "Başka bir uygulamayla paylaş", whatsapp: "WhatsApp", whatsappWeb: "WhatsApp Web", email: "E-posta uygulaması", gmail: "Gmail", outlook: "Outlook", yahoo: "Yahoo Mail", subject: "Z4SK'te sana birkaç özel soru bıraktım" },
  machine: { title: "SHARE invitation_url", hint: "payload=playUrl; adminUrl=REDACTED", native: "navigator.share()", whatsapp: "whatsapp://", whatsappWeb: "web.whatsapp", email: "mailto:", gmail: "gmail.compose", outlook: "outlook.compose", yahoo: "yahoo.compose", subject: "Z4SK_PRIVATE_QUESTIONS" },
};

export function ShareInvitation({ locale, recipientName, playUrl, shareText }: { locale: Locale; recipientName: string; playUrl: string; shareText: string }) {
  const [nativeShare, setNativeShare] = useState(false);
  const c = copy[locale];
  const message = `${interpolate(shareText, { name: recipientName })}\n\n${playUrl}`;

  useEffect(() => { queueMicrotask(() => setNativeShare(typeof navigator.share === "function")); }, []);

  function open(url: string) { window.open(url, "_blank", "noopener,noreferrer"); }
  function shareWhatsapp() { open(`https://wa.me/?text=${encodeURIComponent(message)}`); }
  function shareEmail() { window.location.href = `mailto:?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(message)}`; }
  function shareWebmail(provider: "gmail" | "outlook" | "yahoo") {
    const subject = encodeURIComponent(c.subject); const body = encodeURIComponent(message);
    const urls = { gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, outlook: `https://outlook.office.com/mail/deeplink/compose?subject=${subject}&body=${body}`, yahoo: `https://compose.mail.yahoo.com/?subject=${subject}&body=${body}` };
    open(urls[provider]);
  }
  async function shareNative() { try { await navigator.share({ title: c.subject, text: interpolate(shareText, { name: recipientName }), url: playUrl }); } catch { /* Closing the operating-system share sheet is not an error. */ } }

  return <section className="invitation-share" aria-labelledby="invitation-share-title"><div className="share-heading"><span>↗</span><div><h4 id="invitation-share-title">{c.title}</h4><p>{c.hint}</p></div></div><div className="share-primary">{nativeShare && <button type="button" className="share-native" onClick={shareNative}><i>↗</i>{c.native}</button>}<button type="button" className="share-whatsapp" onClick={shareWhatsapp}><i>WA</i><span className="mobile-share-label">{c.whatsapp}</span><span className="desktop-share-label">{c.whatsappWeb}</span></button><button type="button" onClick={shareEmail}><i>@</i>{c.email}</button></div><div className="share-webmail" role="group" aria-label={c.email}><button type="button" onClick={() => shareWebmail("gmail")}><i>G</i>{c.gmail}</button><button type="button" onClick={() => shareWebmail("outlook")}><i>O</i>{c.outlook}</button><button type="button" onClick={() => shareWebmail("yahoo")}><i>Y</i>{c.yahoo}</button></div></section>;
}
