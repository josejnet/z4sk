import type { Locale } from "./i18n";
import { createOrganicQrDataUrl } from "./organic-qr";
import { SHARED_KEY_COPY } from "./shared-key-copy";
type InviteCopy = {
  title: string;
  from: string;
  headline: string;
  body: string;
  open: string;
  privacy: string;
  sponsor: string;
};
const copy: Record<Locale, InviteCopy> = {
  en: {
    title: "You have something pending · Z4SK",
    from: "AN INVITATION FROM",
    headline: "{name}, there are questions only you can answer.",
    body: "Answer honestly. Only the sender can read your encrypted answers.",
    open: "OPEN QUESTIONNAIRE",
    privacy: "Private bearer link · No account",
    sponsor: "SPONSOR SPACE",
  },
  es: {
    title: "Tienes algo pendiente · Z4SK",
    from: "UNA INVITACIÓN DE",
    headline: "{name}, hay preguntas que solo tú puedes responder.",
    body: "Contesta con sinceridad. Solo quien te la envió podrá leer tus respuestas cifradas.",
    open: "ABRIR CUESTIONARIO",
    privacy: "Enlace privado al portador · Sin registro",
    sponsor: "ESPACIO DE PATROCINIO",
  },
  it: {
    title: "Hai qualcosa in sospeso · Z4SK",
    from: "UN INVITO DA",
    headline: "{name}, ci sono domande a cui solo tu puoi rispondere.",
    body: "Rispondi sinceramente. Solo chi te lo ha inviato potrà leggere le risposte.",
    open: "APRI IL QUESTIONARIO",
    privacy: "Link privato · Senza account",
    sponsor: "SPAZIO SPONSOR",
  },
  fr: {
    title: "Quelque chose vous attend · Z4SK",
    from: "UNE INVITATION DE",
    headline: "{name}, certaines questions n’attendent que votre réponse.",
    body: "Répondez sincèrement. Seule la personne qui vous l’a envoyé pourra lire vos réponses.",
    open: "OUVRIR LE QUESTIONNAIRE",
    privacy: "Lien privé · Sans compte",
    sponsor: "ESPACE SPONSOR",
  },
  de: {
    title: "Etwas wartet auf dich · Z4SK",
    from: "EINE EINLADUNG VON",
    headline: "{name}, manche Fragen kannst nur du beantworten.",
    body: "Antworte ehrlich. Nur die sendende Person kann deine Antworten lesen.",
    open: "FRAGEBOGEN ÖFFNEN",
    privacy: "Privater Link · Ohne Konto",
    sponsor: "SPONSORENBEREICH",
  },
  nl: {
    title: "Er staat iets voor je klaar · Z4SK",
    from: "EEN UITNODIGING VAN",
    headline: "{name}, er zijn vragen die alleen jij kunt beantwoorden.",
    body: "Antwoord eerlijk. Alleen de afzender kan jouw antwoorden lezen.",
    open: "VRAGENLIJST OPENEN",
    privacy: "Privélink · Geen account",
    sponsor: "SPONSORRUIMTE",
  },
  eo: {
    title: "Io atendas vin · Z4SK",
    from: "INVITO DE",
    headline: "{name}, estas demandoj, kiujn nur vi povas respondi.",
    body: "Respondu sincere. Nur la sendinto povas legi viajn respondojn.",
    open: "MALFERMI DEMANDARON",
    privacy: "Privata ligilo · Sen konto",
    sponsor: "SPONSORA SPACO",
  },
  pt: {
    title: "Tens algo por responder · Z4SK",
    from: "UM CONVITE DE",
    headline: "{name}, há perguntas que só tu podes responder.",
    body: "Responde com sinceridade. Só quem enviou poderá ler as tuas respostas.",
    open: "ABRIR QUESTIONÁRIO",
    privacy: "Link privado · Sem conta",
    sponsor: "ESPAÇO DE PATROCÍNIO",
  },
  zh: {
    title: "你有一份待回答的邀请 · Z4SK",
    from: "邀请来自",
    headline: "{name}，有些问题只有你能回答。",
    body: "请诚实回答，只有发送者能看到你的答案。",
    open: "打开问卷",
    privacy: "私人链接 · 无需账户",
    sponsor: "赞助位",
  },
  hi: {
    title: "आपके लिए कुछ बाकी है · Z4SK",
    from: "निमंत्रण भेजा है",
    headline: "{name}, कुछ सवालों का जवाब सिर्फ आप दे सकते हैं।",
    body: "ईमानदारी से जवाब दें। जवाब सिर्फ भेजने वाला देख सकता है।",
    open: "प्रश्नपत्र खोलें",
    privacy: "निजी लिंक · खाता नहीं चाहिए",
    sponsor: "प्रायोजक स्थान",
  },
  ja: {
    title: "あなたへの質問があります・Z4SK",
    from: "招待の送信者",
    headline: "{name}さん、あなただけが答えられる質問があります。",
    body: "正直に答えてください。回答を読めるのは送信者だけです。",
    open: "質問を開く",
    privacy: "非公開リンク・登録不要",
    sponsor: "スポンサー枠",
  },
  tr: {
    title: "Seni bekleyen bir şey var · Z4SK",
    from: "DAVETİ GÖNDEREN",
    headline: "{name}, yalnızca senin yanıtlayabileceğin sorular var.",
    body: "Dürüstçe yanıtla. Yanıtlarını yalnızca gönderen kişi okuyabilir.",
    open: "SORU FORMUNU AÇ",
    privacy: "Özel bağlantı · Hesap yok",
    sponsor: "SPONSOR ALANI",
  },
  machine: {
    title: "PENDING_PAYLOAD · Z4SK",
    from: "INVITATION_FROM",
    headline: "recipient={name}; questions.require=recipient",
    body: "answer.mode=honest; answers.acl=[sender]",
    open: "OPEN questionnaire_url",
    privacy: "link.private=true · auth=null",
    sponsor: "SPONSOR_SLOT",
  },
};
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] || character,
  );
}

export async function downloadInvitationHtml(input: {
  recipientName: string;
  creatorName: string;
  playUrl: string;
  locale: Locale;
  protectedBySharedKey?: boolean;
}) {
  const s = copy[input.locale];
  const body = input.protectedBySharedKey
    ? SHARED_KEY_COPY[input.locale].unlockBody
    : s.body;
  const headline = s.headline.replace("{name}", input.recipientName);
  const qrDataUrl = await createOrganicQrDataUrl(input.playUrl, 420);
  const html = `<!doctype html><html lang="${escapeHtml(input.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(s.title)}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#f4efe8;font-family:Arial,sans-serif;padding:22px}.card{width:min(100%,460px);border:1px solid #302b28;background:linear-gradient(145deg,#181513,#101010);padding:34px;box-shadow:0 30px 80px #000}.logo{font-weight:800;letter-spacing:.2em;font-size:12px}.spark{color:#ff5a1f;font-size:42px;margin:34px 0 16px}small{color:#ff5a1f;letter-spacing:.15em;font-weight:700}h1{font:400 42px/1.03 Georgia,serif;letter-spacing:-.04em;margin:14px 0 18px}p{color:#aaa19a;line-height:1.6}.qr{display:block;width:min(100%,320px);height:auto;margin:24px auto;background:#fff;border:12px solid #fff}.cta{display:block;background:#ff5a1f;color:#111;text-decoration:none;padding:17px 20px;margin-top:22px;font-weight:800;text-align:center}.link{color:#8f8781;font:11px/1.5 monospace;overflow-wrap:anywhere;margin-top:16px}.ad{border-top:1px solid #2d2927;margin-top:30px;padding-top:18px;color:#625d59;font-size:10px;text-align:center}.privacy{font-size:11px;color:#6f6964;text-align:center;margin-top:18px}</style></head><body><main class="card"><div class="logo">Z4SK</div><div class="spark">✦</div><small>${escapeHtml(s.from)} ${escapeHtml(input.creatorName)}</small><h1>${escapeHtml(headline)}</h1><p>${escapeHtml(body)}</p><img class="qr" src="${qrDataUrl}" alt="QR Z4SK"><a class="cta" href="${escapeHtml(input.playUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.open)} →</a><p class="link">${escapeHtml(input.playUrl)}</p><div class="privacy">◆ ${escapeHtml(s.privacy)}</div><div class="ad">${escapeHtml(s.sponsor)} · Z4SK</div></main></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `open-${input.recipientName.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, "-")}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
