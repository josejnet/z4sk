"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/i18n";
import { drawOrganicQr } from "../lib/organic-qr";
import { SHARED_KEY_COPY } from "../lib/shared-key-copy";

type QrKind = "invitation" | "dashboard";
type Copy = {
  inviteKicker: string;
  inviteTitle: string;
  inviteBody: string;
  inviteCta: string;
  secretKicker: string;
  secretTitle: string;
  secretBody: string;
  secretCta: string;
  publicHeading: string;
  publicHint: string;
  privateHeading: string;
  privateHint: string;
  png: string;
  jpg: string;
  share: string;
  generating: string;
  error: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    inviteKicker: "A PRIVATE INVITATION",
    inviteTitle: "{name}, someone dared to ask you.",
    inviteBody: "Open the link or scan this QR. The invitation expires automatically.",
    inviteCta: "SCAN · ANSWER · DARE",
    secretKicker: "SECRET CREATOR ACCESS",
    secretTitle: "Your private dashboard, saved as a QR.",
    secretBody:
      "Keep this image private. Anyone who scans it can open your dashboard and read the answers.",
    secretCta: "SECRET · DO NOT SHARE",
    publicHeading: "Invitation QR · same access as the answer link",
    publicHint:
      "Send this QR or the link shown below: both open the same invitation. This QR never contains your private dashboard link.",
    privateHeading: "Private dashboard QR",
    privateHint:
      "Save it or take a screenshot. It replaces email recovery and is generated only on this device.",
    png: "Download PNG",
    jpg: "Download JPG",
    share: "Share QR + link",
    generating: "Generating secure QR…",
    error: "The QR image could not be generated.",
  },
  es: {
    inviteKicker: "UNA INVITACIÓN PRIVADA",
    inviteTitle: "{name}, alguien se ha atrevido a preguntarte.",
    inviteBody: "Abre el enlace o escanea este QR. La invitación caduca automáticamente.",
    inviteCta: "ESCANEA · RESPONDE · ATRÉVETE",
    secretKicker: "ACCESO SECRETO DEL CREADOR",
    secretTitle: "Tu panel privado, guardado en un QR.",
    secretBody:
      "Guarda esta imagen en privado. Quien la escanee podrá abrir tu panel y leer las respuestas.",
    secretCta: "SECRETO · NO COMPARTIR",
    publicHeading: "QR de invitación · el mismo acceso que el enlace",
    publicHint:
      "Envía este QR o el enlace que aparece debajo: ambos abren la misma invitación. Este QR nunca contiene el enlace de tu panel privado. El enlace por sí solo no puede abrir esta invitación.",
    privateHeading: "QR del panel privado",
    privateHint:
      "Guárdalo o haz una captura. Sustituye la recuperación por correo y se genera solo en este dispositivo.",
    png: "Descargar PNG",
    jpg: "Descargar JPG",
    share: "Compartir QR + enlace",
    generating: "Generando QR seguro…",
    error: "No se ha podido generar la imagen QR.",
  },
  it: {
    inviteKicker: "UN INVITO PRIVATO",
    inviteTitle: "{name}, qualcuno ha osato farti una domanda.",
    inviteBody: "Apri il link o scansiona questo QR. L'invito scade automaticamente.",
    inviteCta: "SCANSIONA · RISPONDI · OSA",
    secretKicker: "ACCESSO SEGRETO DEL CREATORE",
    secretTitle: "Il tuo pannello privato, salvato in un QR.",
    secretBody:
      "Conserva questa immagine in privato. Chi la scansiona può aprire il pannello e leggere le risposte.",
    secretCta: "SEGRETO · NON CONDIVIDERE",
    publicHeading: "Cartolina QR dell'invito",
    publicHint:
      "Scarica o condividi l'immagine. Il QR contiene solo il link pubblico per rispondere.",
    privateHeading: "QR del pannello privato",
    privateHint:
      "Salvalo o fai uno screenshot. Sostituisce il recupero via e-mail ed è generato solo su questo dispositivo.",
    png: "Scarica PNG",
    jpg: "Scarica JPG",
    share: "Condividi QR + link",
    generating: "Generazione QR sicuro…",
    error: "Impossibile generare l'immagine QR.",
  },
  fr: {
    inviteKicker: "UNE INVITATION PRIVÉE",
    inviteTitle: "{name}, quelqu'un a osé vous poser la question.",
    inviteBody: "Ouvrez le lien ou scannez ce QR. L'invitation expire automatiquement.",
    inviteCta: "SCANNEZ · RÉPONDEZ · OSEZ",
    secretKicker: "ACCÈS SECRET DU CRÉATEUR",
    secretTitle: "Votre espace privé, conservé dans un QR.",
    secretBody:
      "Gardez cette image privée. Toute personne qui la scanne peut ouvrir votre espace et lire les réponses.",
    secretCta: "SECRET · NE PAS PARTAGER",
    publicHeading: "Carte QR d'invitation",
    publicHint:
      "Téléchargez ou partagez cette image. Le QR contient uniquement le lien public de réponse.",
    privateHeading: "QR de l'espace privé",
    privateHint:
      "Enregistrez-le ou faites une capture. Il remplace la récupération par e-mail et reste généré sur cet appareil.",
    png: "Télécharger PNG",
    jpg: "Télécharger JPG",
    share: "Partager QR + lien",
    generating: "Création du QR sécurisé…",
    error: "Impossible de créer l'image QR.",
  },
  de: {
    inviteKicker: "EINE PRIVATE EINLADUNG",
    inviteTitle: "{name}, jemand hat sich getraut, dich zu fragen.",
    inviteBody: "Öffne den Link oder scanne diesen QR. Die Einladung läuft automatisch ab.",
    inviteCta: "SCANNEN · ANTWORTEN · TRAUEN",
    secretKicker: "GEHEIMER ERSTELLER-ZUGANG",
    secretTitle: "Dein privater Bereich, als QR gespeichert.",
    secretBody:
      "Bewahre dieses Bild geheim auf. Wer es scannt, kann deinen Bereich öffnen und die Antworten lesen.",
    secretCta: "GEHEIM · NICHT TEILEN",
    publicHeading: "QR-Einladungskarte",
    publicHint:
      "Lade das Bild herunter oder teile es. Der QR enthält nur den öffentlichen Antwort-Link.",
    privateHeading: "QR für den privaten Bereich",
    privateHint:
      "Speichere ihn oder mache einen Screenshot. Er ersetzt die E-Mail-Wiederherstellung und entsteht nur auf diesem Gerät.",
    png: "PNG herunterladen",
    jpg: "JPG herunterladen",
    share: "QR + Link teilen",
    generating: "Sicherer QR wird erstellt…",
    error: "Das QR-Bild konnte nicht erstellt werden.",
  },
  nl: {
    inviteKicker: "EEN PRIVÉ-UITNODIGING",
    inviteTitle: "{name}, iemand durfde het je te vragen.",
    inviteBody: "Open de link of scan deze QR. De uitnodiging verloopt automatisch.",
    inviteCta: "SCAN · ANTWOORD · DURF",
    secretKicker: "GEHEIME TOEGANG VOOR DE MAKER",
    secretTitle: "Je privédashboard, bewaard als QR.",
    secretBody:
      "Bewaar deze afbeelding privé. Wie hem scant, kan je dashboard openen en de antwoorden lezen.",
    secretCta: "GEHEIM · NIET DELEN",
    publicHeading: "QR-uitnodigingskaart",
    publicHint:
      "Download of deel deze afbeelding. De QR bevat alleen de openbare antwoordlink.",
    privateHeading: "QR van je privédashboard",
    privateHint:
      "Bewaar hem of maak een screenshot. Dit vervangt e-mailherstel en wordt alleen op dit apparaat gemaakt.",
    png: "PNG downloaden",
    jpg: "JPG downloaden",
    share: "Deel QR + link",
    generating: "Veilige QR maken…",
    error: "De QR-afbeelding kon niet worden gemaakt.",
  },
  eo: {
    inviteKicker: "PRIVATA INVITO",
    inviteTitle: "{name}, iu kuraĝis demandi vin.",
    inviteBody: "Malfermu la ligilon aŭ skanu ĉi tiun QR. La invito aŭtomate eksvalidiĝas.",
    inviteCta: "SKANU · RESPONDU · KURAĜU",
    secretKicker: "SEKRETA ALIRO DE LA KREINTO",
    secretTitle: "Via privata panelo, konservita kiel QR.",
    secretBody:
      "Konservu ĉi tiun bildon private. Ĉiu skananto povas malfermi la panelon kaj legi la respondojn.",
    secretCta: "SEKRETA · NE KUNDIVIDU",
    publicHeading: "QR-karto de la invito",
    publicHint:
      "Elŝutu aŭ kundividu la bildon. La QR enhavas nur la publikan respondligilon.",
    privateHeading: "QR de la privata panelo",
    privateHint:
      "Konservu ĝin aŭ fotu la ekranon. Ĝi anstataŭas retpoŝtan reakiron kaj kreiĝas nur en ĉi tiu aparato.",
    png: "Elŝuti PNG",
    jpg: "Elŝuti JPG",
    share: "Kunhavigi QR + ligilon",
    generating: "Kreante sekuran QR…",
    error: "La QR-bildo ne povis esti kreita.",
  },
  pt: {
    inviteKicker: "UM CONVITE PRIVADO",
    inviteTitle: "{name}, alguém teve coragem de perguntar.",
    inviteBody: "Abre o link ou lê este QR. O convite expira automaticamente.",
    inviteCta: "LÊ · RESPONDE · ARRISCA",
    secretKicker: "ACESSO SECRETO DO CRIADOR",
    secretTitle: "O teu painel privado, guardado num QR.",
    secretBody:
      "Guarda esta imagem em privado. Quem a ler pode abrir o painel e ver as respostas.",
    secretCta: "SECRETO · NÃO PARTILHAR",
    publicHeading: "Cartão QR do convite",
    publicHint:
      "Descarrega ou partilha esta imagem. O QR contém apenas o link público para responder.",
    privateHeading: "QR do painel privado",
    privateHint:
      "Guarda-o ou faz uma captura. Substitui a recuperação por e-mail e é gerado apenas neste dispositivo.",
    png: "Descarregar PNG",
    jpg: "Descarregar JPG",
    share: "Partilhar QR + link",
    generating: "A gerar QR seguro…",
    error: "Não foi possível gerar a imagem QR.",
  },
  zh: {
    inviteKicker: "一份私人邀请",
    inviteTitle: "{name}，有人鼓起勇气想问你。",
    inviteBody: "打开链接或扫描此二维码。邀请会自动到期。",
    inviteCta: "扫码 · 回答 · 勇敢一点",
    secretKicker: "创建者秘密访问",
    secretTitle: "用二维码保存你的私人面板。",
    secretBody: "请私密保存此图片。任何扫描它的人都能打开面板并查看回答。",
    secretCta: "秘密 · 请勿分享",
    publicHeading: "邀请二维码卡片",
    publicHint: "下载或分享此图片。二维码只包含公开回答链接。",
    privateHeading: "私人面板二维码",
    privateHint: "保存图片或截图。它可替代邮箱找回，并且只在此设备上生成。",
    png: "下载 PNG",
    jpg: "下载 JPG",
    share: "分享二维码和链接",
    generating: "正在生成安全二维码…",
    error: "无法生成二维码图片。",
  },
  hi: {
    inviteKicker: "एक निजी निमंत्रण",
    inviteTitle: "{name}, किसी ने आपसे पूछने की हिम्मत की है।",
    inviteBody: "लिंक खोलें या यह QR स्कैन करें। निमंत्रण अपने आप समाप्त हो जाएगा।",
    inviteCta: "स्कैन · जवाब · हिम्मत",
    secretKicker: "निर्माता की गुप्त पहुँच",
    secretTitle: "आपका निजी डैशबोर्ड, QR में सुरक्षित।",
    secretBody:
      "इस तस्वीर को निजी रखें। इसे स्कैन करने वाला आपका डैशबोर्ड और जवाब देख सकता है।",
    secretCta: "गुप्त · साझा न करें",
    publicHeading: "निमंत्रण QR कार्ड",
    publicHint:
      "इस तस्वीर को डाउनलोड या साझा करें। QR में सिर्फ सार्वजनिक जवाब लिंक है।",
    privateHeading: "निजी डैशबोर्ड QR",
    privateHint:
      "इसे सहेजें या स्क्रीनशॉट लें। यह ईमेल रिकवरी की जगह लेता है और केवल इस डिवाइस पर बनता है।",
    png: "PNG डाउनलोड करें",
    jpg: "JPG डाउनलोड करें",
    share: "QR और लिंक साझा करें",
    generating: "सुरक्षित QR बन रहा है…",
    error: "QR तस्वीर नहीं बन सकी।",
  },
  ja: {
    inviteKicker: "非公開の招待",
    inviteTitle: "{name}さん、誰かが勇気を出して聞きました。",
    inviteBody: "リンクを開くか、このQRを読み取ってください。招待は自動的に期限切れになります。",
    inviteCta: "読み取る · 答える · 踏み出す",
    secretKicker: "作成者の秘密アクセス",
    secretTitle: "非公開パネルをQRで保存。",
    secretBody:
      "この画像は秘密に保管してください。読み取った人はパネルを開き、回答を閲覧できます。",
    secretCta: "秘密 · 共有禁止",
    publicHeading: "招待QRカード",
    publicHint:
      "画像を保存または共有できます。QRに含まれるのは公開回答リンクだけです。",
    privateHeading: "非公開パネルQR",
    privateHint:
      "保存またはスクリーンショットしてください。メール復旧の代わりになり、この端末内だけで生成されます。",
    png: "PNGを保存",
    jpg: "JPGを保存",
    share: "QRとリンクを共有",
    generating: "安全なQRを作成中…",
    error: "QR画像を作成できませんでした。",
  },
  tr: {
    inviteKicker: "ÖZEL BİR DAVET",
    inviteTitle: "{name}, biri sana sormaya cesaret etti.",
    inviteBody: "Bağlantıyı aç veya bu QR'ı tara. Davetin süresi otomatik olarak dolar.",
    inviteCta: "TARA · YANITLA · CESARET ET",
    secretKicker: "OLUŞTURUCU GİZLİ ERİŞİMİ",
    secretTitle: "Özel panelin QR olarak kaydedildi.",
    secretBody:
      "Bu görseli gizli tut. Tarayan herkes panelini açıp yanıtları okuyabilir.",
    secretCta: "GİZLİ · PAYLAŞMA",
    publicHeading: "Davet QR kartı",
    publicHint:
      "Bu görseli indir veya paylaş. QR yalnızca herkese açık yanıt bağlantısını içerir.",
    privateHeading: "Özel panel QR'ı",
    privateHint:
      "Kaydet veya ekran görüntüsü al. E-posta kurtarmanın yerini alır ve yalnızca bu cihazda oluşturulur.",
    png: "PNG indir",
    jpg: "JPG indir",
    share: "QR + bağlantı paylaş",
    generating: "Güvenli QR oluşturuluyor…",
    error: "QR görseli oluşturulamadı.",
  },
  machine: {
    inviteKicker: "PRIVATE_INVITATION",
    inviteTitle: "recipient={name}; query.pending=true",
    inviteBody: "OPEN link OR SCAN qr; TTL=user_selected",
    inviteCta: "SCAN::ANSWER::DARE",
    secretKicker: "SECRET_CREATOR_ACCESS",
    secretTitle: "dashboard.access_token => QR",
    secretBody: "CLASSIFICATION=SECRET; scanner=>read_private_answers",
    secretCta: "SECRET::DO_NOT_SHARE",
    publicHeading: "EXPORT invitation_qr",
    publicHint: "qr.payload=play_url; admin_url=REDACTED",
    privateHeading: "EXPORT dashboard_qr",
    privateHint: "recovery=email:none; generation=device_local",
    png: "DOWNLOAD .png",
    jpg: "DOWNLOAD .jpg",
    share: "SHARE qr+url",
    generating: "GENERATING secure_qr…",
    error: "ERR_QR_GENERATION",
  },
};

const PRIVATE_WARNING: Record<Locale, string> = {
  en: "Warning: this QR contains the secret creator link, but not the separate shared key. Keep it private. Anyone who obtains both can open the dashboard and decrypt answers.",
  es: "Este QR contiene el enlace secreto del creador, pero no la llave compartida. Guárdalo en privado. Quien consiga ambos podrá abrir el panel y descifrar respuestas.",
  it: "Attenzione: questo QR contiene il link segreto del creatore, ma non la chiave condivisa separata. Chi ottiene entrambi può aprire il pannello e decifrare le risposte.",
  fr: "Attention : ce QR contient le lien secret du créateur, mais pas la clé partagée séparée. Toute personne obtenant les deux peut ouvrir le tableau de bord et déchiffrer les réponses.",
  de: "Warnung: Dieser QR enthält den geheimen Ersteller-Link, aber nicht den getrennten gemeinsamen Schlüssel. Wer beides besitzt, kann das Dashboard öffnen und Antworten entschlüsseln.",
  nl: "Waarschuwing: deze QR bevat de geheime makerslink, maar niet de aparte gedeelde sleutel. Wie beide bezit, kan het dashboard openen en antwoorden ontsleutelen.",
  eo: "Averto: ĉi tiu QR enhavas la sekretan ligilon de la kreinto, sed ne la apartan komunan ŝlosilon. Posedanto de ambaŭ povas malfermi la panelon kaj malĉifri respondojn.",
  pt: "Aviso: este QR contém o link secreto do criador, mas não a chave partilhada separada. Quem obtiver ambos pode abrir o painel e decifrar respostas.",
  zh: "警告：此二维码包含创建者的秘密链接，但不包含单独共享的密钥。同时获得两者的人可以打开面板并解密回答。",
  hi: "चेतावनी: इस QR में निर्माता का गुप्त लिंक है, अलग साझा कुंजी नहीं। दोनों पाने वाला पैनल खोलकर जवाब डिक्रिप्ट कर सकता है।",
  ja: "警告：このQRには作成者の秘密リンクが含まれますが、別経路の共有鍵は含まれません。両方を得た人はパネルを開き、回答を復号できます。",
  tr: "Uyarı: bu QR gizli oluşturucu bağlantısını içerir, ayrı paylaşılan anahtarı içermez. İkisini alan kişi paneli açıp yanıtları çözebilir.",
  machine:
    "WARNING: qr.contains=creator_secret_url; qr.shared_key=false; holder(qr,shared_key)=>dashboard.decrypt(ciphertext)",
};

const PRIVATE_LINK_WARNING: Record<Locale, string> = {
  en: "Warning: this QR is the complete secret creator link. Anyone who scans it can open the dashboard and decrypt answers.",
  es: "Aviso: este QR es el enlace secreto completo del creador. Quien lo escanee podrá abrir el panel y descifrar respuestas.",
  it: "Attenzione: questo QR è il link segreto completo del creatore. Chi lo scansiona può aprire il pannello e decifrare le risposte.",
  fr: "Attention : ce QR est le lien créateur secret complet. Toute personne qui le scanne peut ouvrir le tableau de bord et déchiffrer les réponses.",
  de: "Warnung: Dieser QR ist der vollständige geheime Ersteller-Link. Wer ihn scannt, kann das Dashboard öffnen und Antworten entschlüsseln.",
  nl: "Waarschuwing: deze QR is de volledige geheime makerslink. Wie hem scant kan het dashboard openen en antwoorden ontsleutelen.",
  eo: "Averto: ĉi tiu QR estas la kompleta sekreta ligilo de la kreinto. Kiu skanas ĝin povas malfermi la panelon kaj malĉifri respondojn.",
  pt: "Aviso: este QR é o link secreto completo do criador. Quem o ler pode abrir o painel e decifrar respostas.",
  zh: "警告：此二维码是完整的创建者秘密链接。任何扫描者都能打开面板并解密回答。",
  hi: "चेतावनी: यह QR पूरा गुप्त निर्माता लिंक है। इसे स्कैन करने वाला पैनल खोलकर जवाब डिक्रिप्ट कर सकता है।",
  ja: "警告：このQRは作成者用の完全な秘密リンクです。読み取った人はパネルを開き、回答を復号できます。",
  tr: "Uyarı: bu QR tam gizli oluşturucu bağlantısıdır. Tarayan kişi paneli açıp yanıtları çözebilir.",
  machine: "WARNING: qr.contains=complete_creator_secret_url; scanner=>dashboard.decrypt(ciphertext)",
};

function fillTemplate(value: string, name: string) {
  return value.replace("{name}", name);
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const spaced = /\s/.test(text);
  const tokens = spaced ? text.split(/\s+/) : [...text];
  let line = "";
  let lines = 0;
  for (const token of tokens) {
    const candidate = line ? `${line}${spaced ? " " : ""}${token}` : token;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = token;
      if (lines >= maxLines - 1) break;
    } else line = candidate;
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
  return y + lineHeight;
}

async function renderCard(
  canvas: HTMLCanvasElement,
  kind: QrKind,
  locale: Locale,
  name: string,
  url: string,
  protectedBySharedKey: boolean,
) {
  const c = COPY[locale];
  const invitation = kind === "invitation";
  const accent = invitation ? "#ff5a1f" : "#b989ff";
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, 1080, 1350);
  const gradient = ctx.createRadialGradient(850, 180, 20, 850, 180, 520);
  gradient.addColorStop(
    0,
    invitation ? "rgba(255,90,31,.22)" : "rgba(185,137,255,.2)",
  );
  gradient.addColorStop(1, "rgba(11,11,11,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 650);
  ctx.strokeStyle = "#37312d";
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, 992, 1262);
  ctx.fillStyle = accent;
  ctx.fillRect(44, 44, 12, 1262);
  ctx.fillStyle = "#f4efe8";
  ctx.font = "800 34px Arial, sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("Z4SK", 80, 108);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = accent;
  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillText(invitation ? c.inviteKicker : c.secretKicker, 80, 192);
  ctx.fillStyle = "#f4efe8";
  ctx.font = "700 64px Arial, 'Noto Sans', sans-serif";
  ctx.textAlign = "center";
  const title = fillTemplate(invitation ? c.inviteTitle : c.secretTitle, name);
  drawWrapped(ctx, title, 540, 278, 880, 72, 3);
  ctx.textAlign = "left";
  const qr = document.createElement("canvas");
  await drawOrganicQr(qr, url, { targetSize: 440 });
  ctx.fillStyle = "#fff";
  ctx.fillRect(310, 500, 460, 460);
  ctx.drawImage(qr, 540 - qr.width / 2, 730 - qr.height / 2);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(310, 500, 460, 460);
  ctx.fillStyle = accent;
  ctx.fillRect(275, 465, 90, 8);
  ctx.fillRect(275, 465, 8, 90);
  ctx.fillRect(715, 987, 90, 8);
  ctx.fillRect(797, 905, 8, 90);
  ctx.fillStyle = "#77706a";
  ctx.font = "700 18px Arial, 'Noto Sans', sans-serif";
  ctx.fillText("LINK", 80, 1035);
  ctx.fillStyle = "#f4efe8";
  ctx.font = "400 20px Arial, 'Noto Sans', sans-serif";
  drawWrapped(ctx, url, 80, 1075, 920, 30, 2);
  ctx.fillStyle = "#aaa19a";
  ctx.font = "400 24px Arial, 'Noto Sans', sans-serif";
  drawWrapped(
    ctx,
    invitation
      ? protectedBySharedKey
        ? `${c.inviteBody} ${SHARED_KEY_COPY[locale].unlockBody}`
        : c.inviteBody
      : protectedBySharedKey
        ? PRIVATE_WARNING[locale]
        : PRIVATE_LINK_WARNING[locale],
    80,
    1165,
    920,
    34,
    2,
  );
  ctx.fillStyle = accent;
  ctx.font = "800 24px Arial, 'Noto Sans', sans-serif";
  ctx.fillText(invitation ? c.inviteCta : c.secretCta, 80, 1270);
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/jpeg",
) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("blob"))),
      type,
      0.92,
    ),
  );
}

export function QrCard({
  kind,
  locale,
  name,
  url,
  protectedBySharedKey = false,
}: {
  kind: QrKind;
  locale: Locale;
  name: string;
  url: string;
  protectedBySharedKey?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const c = COPY[locale];
  const invitation = kind === "invitation";
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setReady(false);
      setError(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      void renderCard(canvas, kind, locale, name, url, protectedBySharedKey)
        .then(() => {
          if (active) setReady(true);
        })
        .catch(() => {
          if (active) setError(true);
        });
    });
    return () => {
      active = false;
    };
  }, [kind, locale, name, protectedBySharedKey, url]);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const file = new File(["z4sk"], "z4sk.png", { type: "image/png" });
        setCanShare(
          typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] }),
        );
      } catch {
        /* File sharing is optional. */
      }
    });
  }, []);
  async function download(type: "image/png" | "image/jpeg") {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const blob = await canvasBlob(canvas, type);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `z4sk-${invitation ? "invitation" : "private-dashboard"}.${type === "image/png" ? "png" : "jpg"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  async function share() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    try {
      const blob = await canvasBlob(canvas, "image/png");
      const file = new File(
        [blob],
        `z4sk-${invitation ? "invitation" : "private-dashboard"}.png`,
        { type: "image/png" },
      );
      await navigator.share({
        files: [file],
        title: invitation ? c.publicHeading : c.privateHeading,
        text: invitation ? `${c.inviteBody}\n${url}` : c.privateHint,
        ...(invitation ? { url } : {}),
      });
    } catch {
      /* Closing the native share sheet is not an error. */
    }
  }
  return (
    <section className={`qr-card ${invitation ? "public" : "private"}`}>
      <div className="qr-card-copy">
        <span>{invitation ? "QR ↗" : "QR ◆"}</span>
        <div>
          <h4>{invitation ? c.publicHeading : c.privateHeading}</h4>
          {invitation && (
            <p>
              {protectedBySharedKey
                ? `${c.publicHint} ${SHARED_KEY_COPY[locale].unlockBody}`
                : c.publicHint}
            </p>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        aria-label={invitation ? c.publicHeading : c.privateHeading}
      />
      {!invitation && (
        <p className="qr-warning" role="note">
          <b>!</b>
          {protectedBySharedKey
            ? PRIVATE_WARNING[locale]
            : PRIVATE_LINK_WARNING[locale]}
        </p>
      )}
      {invitation && (
        <a className="qr-link" href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      )}
      {!ready && !error && <p className="qr-status">{c.generating}</p>}
      {error && (
        <p className="qr-status error" role="alert">
          {c.error}
        </p>
      )}
      <div className="qr-actions">
        <button
          type="button"
          disabled={!ready}
          onClick={() => void download("image/png")}
        >
          {c.png}
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => void download("image/jpeg")}
        >
          {c.jpg}
        </button>
        {invitation && canShare ? (
          <button
            type="button"
            className="qr-share"
            disabled={!ready}
            onClick={() => void share()}
          >
            {c.share}
          </button>
        ) : !invitation ? (
          <span className="qr-action-spacer" aria-hidden="true" />
        ) : null}
      </div>
    </section>
  );
}
