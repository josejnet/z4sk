"use client";

import { useEffect, useRef, useState } from "react";
import { getDefaultQuestions, getLevels, getQuestions } from "../lib/questions";
import type { Level } from "../lib/types";
import { interpolate, type Locale, useLanguage } from "../lib/i18n";
import { QrCard } from "./QrCard";
import { ShareInvitation } from "./ShareInvitation";
import { SharedKeyCard } from "./SharedKeyCard";
import { SharedKeySetup } from "./SharedKeySetup";
import {
  attachPrivateDecryptionKey,
  generateCreatorAccessCredential,
  generateResponseKeyPair,
} from "../lib/response-crypto";
import {
  attachInvitationSecret,
  attachSubmissionToken,
  encryptPrivateInvitation,
  generateInvitationSecret,
} from "../lib/invitation-crypto";
import { NAME_RULE_COPY } from "../lib/name-copy";
import { SHARED_KEY_COPY } from "../lib/shared-key-copy";
const localized = <T,>(base: Record<Locale, T>) => base;

type Created = { id: string; playUrl: string; adminUrl: string };
const growthCopy = localized<{
  title: string;
  copy: string;
  button: string;
  unlocked: string;
  share: string;
}>({
  en: {
    title: "Make this questionnaire ad-free",
    copy: "Share Z4SK once. You bring someone new; we remove every ad from this questionnaire.",
    button: "Share once & remove ads",
    unlocked: "Unlocked · This questionnaire is now ad-free",
    share:
      "Create a private questionnaire and share it on WhatsApp. Ask. Answer. Dare.",
  },
  es: {
    title: "Deja este cuestionario sin anuncios",
    copy: "Comparte Z4SK una vez. Tú traes a alguien nuevo y nosotros quitamos todos los anuncios.",
    button: "Compartir una vez y quitar anuncios",
    unlocked: "Desbloqueado · Este cuestionario ya no tiene anuncios",
    share:
      "Crea un cuestionario privado y compártelo por WhatsApp. Pregunta. Responde. Atrévete.",
  },
  it: {
    title: "Rendi questo questionario senza pubblicità",
    copy: "Condividi Z4SK una volta. Tu porti una nuova persona, noi togliamo tutta la pubblicità.",
    button: "Condividi e rimuovi la pubblicità",
    unlocked: "Sbloccato · Questo questionario è senza pubblicità",
    share:
      "Crea un questionario privato e condividilo su WhatsApp. Domanda. Rispondi. Osa.",
  },
  fr: {
    title: "Rendez ce questionnaire sans publicité",
    copy: "Partagez Z4SK une fois. Vous invitez une personne, nous retirons toutes les publicités.",
    button: "Partager et retirer les publicités",
    unlocked: "Débloqué · Ce questionnaire est sans publicité",
    share:
      "Créez un questionnaire privé et partagez-le sur WhatsApp. Demandez. Répondez. Osez.",
  },
  de: {
    title: "Diesen Fragebogen werbefrei machen",
    copy: "Teile Z4SK einmal. Du bringst eine neue Person, wir entfernen sämtliche Werbung.",
    button: "Teilen und Werbung entfernen",
    unlocked: "Freigeschaltet · Dieser Fragebogen ist werbefrei",
    share:
      "Erstelle einen privaten Fragebogen und teile ihn über WhatsApp. Fragen. Antworten. Trauen.",
  },
  nl: {
    title: "Maak deze vragenlijst advertentievrij",
    copy: "Deel Z4SK één keer. Jij brengt iemand nieuws; wij verwijderen alle advertenties.",
    button: "Eenmaal delen en advertenties verwijderen",
    unlocked: "Ontgrendeld · Deze vragenlijst is nu advertentievrij",
    share:
      "Maak een privévragenlijst en deel die via WhatsApp. Vraag. Antwoord. Durf.",
  },
  eo: {
    title: "Forigu reklamojn de ĉi tiu demandaro",
    copy: "Kundividu Z4SK unufoje. Vi venigas novan personon; ni forigas ĉiujn reklamojn.",
    button: "Kundividi kaj forigi reklamojn",
    unlocked: "Malŝlosita · Ĉi tiu demandaro nun estas sen reklamoj",
    share:
      "Kreu privatan demandaron kaj kundividu ĝin per WhatsApp. Demandu. Respondu. Kuraĝu.",
  },
  pt: {
    title: "Deixa este questionário sem anúncios",
    copy: "Partilha o Z4SK uma vez. Trazes uma pessoa nova e retiramos todos os anúncios.",
    button: "Partilhar e retirar anúncios",
    unlocked: "Desbloqueado · Este questionário está sem anúncios",
    share:
      "Cria um questionário privado e partilha-o no WhatsApp. Pergunta. Responde. Arrisca.",
  },
  zh: {
    title: "让问卷无广告",
    copy: "分享一次 Z4SK，我们就会移除这份问卷中的广告。",
    button: "分享并移除广告",
    unlocked: "已解锁 · 这份问卷现在无广告",
    share: "创建私人问卷，通过 WhatsApp 分享。提问、回答、勇敢一点。",
  },
  hi: {
    title: "इस प्रश्नपत्र से विज्ञापन हटाएँ",
    copy: "Z4SK को एक बार साझा करें और हम इस प्रश्नपत्र से विज्ञापन हटा देंगे।",
    button: "साझा करें और विज्ञापन हटाएँ",
    unlocked: "अनलॉक · अब यह प्रश्नपत्र विज्ञापन-मुक्त है",
    share:
      "निजी प्रश्नपत्र बनाएँ और WhatsApp पर साझा करें। पूछें। जवाब दें। हिम्मत करें।",
  },
  ja: {
    title: "この質問を広告なしにする",
    copy: "Z4SKを一度共有すると、この質問から広告をすべて削除します。",
    button: "共有して広告を削除",
    unlocked: "解除済み・この質問は広告なしです",
    share: "非公開の質問を作り、WhatsAppで共有。聞く。答える。踏み出す。",
  },
  tr: {
    title: "Bu soru formunu reklamsız yap",
    copy: "Z4SK'i bir kez paylaş. Sen yeni birini getir, biz tüm reklamları kaldıralım.",
    button: "Paylaş ve reklamları kaldır",
    unlocked: "Açıldı · Bu soru formu artık reklamsız",
    share:
      "Özel bir soru formu oluştur ve WhatsApp'ta paylaş. Sor. Yanıtla. Cesaret et.",
  },
  machine: {
    title: "SET questionnaire.ads=false",
    copy: "SHARE Z4SK ONCE => referral+1 => ads.remove_all()",
    button: "SHARE_AND_UNLOCK",
    unlocked: "UNLOCKED · ads=false",
    share: "CREATE private_questionnaire; SEND whatsapp://; ASK.ANSWER.DARE.",
  },
});
const responseModeCopy = localized<{
  heading: string;
  normal: string;
  normalCopy: string;
  once: string;
  onceCopy: string;
  selected: string;
}>({
  en: {
    heading: "HOW MANY RESPONSES?",
    normal: "Normal mode",
    normalCopy:
      "Several people can answer with the same link. You can view every response until the link expires or you delete it.",
    once: "View once",
    onceCopy:
      "Only the first response is accepted. It stays sealed; when you tap “View and destroy”, the invitation and response are deleted from the active database.",
    selected: "SELECTED",
  },
  es: {
    heading: "¿CUÁNTAS RESPUESTAS?",
    normal: "Modo normal",
    normalCopy:
      "Varias personas pueden responder con el mismo enlace. Verás todas las respuestas hasta que el enlace caduque o tú las elimines.",
    once: "Ver una vez",
    onceCopy:
      "Solo se acepta la primera respuesta. Queda sellada y, al pulsar «Ver y destruir», la invitación y la respuesta se borran de la base de datos activa.",
    selected: "SELECCIONADO",
  },
  it: {
    heading: "QUANTE RISPOSTE?",
    normal: "Modalità normale",
    normalCopy:
      "Più persone possono rispondere con lo stesso link. Vedrai tutte le risposte finché il link non scade o le elimini.",
    once: "Visualizza una volta",
    onceCopy:
      "Viene accettata solo la prima risposta. Resta sigillata e, toccando “Visualizza ed elimina”, invito e risposta vengono cancellati dal database attivo.",
    selected: "SELEZIONATO",
  },
  fr: {
    heading: "COMBIEN DE RÉPONSES ?",
    normal: "Mode normal",
    normalCopy:
      "Plusieurs personnes peuvent répondre avec le même lien. Toutes les réponses restent visibles jusqu'à l'expiration du lien ou leur suppression.",
    once: "Voir une fois",
    onceCopy:
      "Seule la première réponse est acceptée. Elle reste scellée ; en touchant « Voir et détruire », l'invitation et la réponse sont supprimées de la base active.",
    selected: "SÉLECTIONNÉ",
  },
  de: {
    heading: "WIE VIELE ANTWORTEN?",
    normal: "Normaler Modus",
    normalCopy:
      "Mehrere Personen können über denselben Link antworten. Alle Antworten bleiben bis zum Ablauf oder bis zum Löschen sichtbar.",
    once: "Einmal ansehen",
    onceCopy:
      "Nur die erste Antwort wird angenommen. Sie bleibt versiegelt; bei „Ansehen und löschen“ werden Einladung und Antwort aus der aktiven Datenbank gelöscht.",
    selected: "AUSGEWÄHLT",
  },
  nl: {
    heading: "HOEVEEL ANTWOORDEN?",
    normal: "Normale modus",
    normalCopy:
      "Meerdere mensen kunnen via dezelfde link antwoorden. Je ziet alle antwoorden totdat de link verloopt of je ze verwijdert.",
    once: "Eenmalig bekijken",
    onceCopy:
      "Alleen het eerste antwoord wordt geaccepteerd. Het blijft verzegeld; met ‘Bekijk en vernietig’ worden uitnodiging en antwoord uit de actieve database verwijderd.",
    selected: "GESELECTEERD",
  },
  eo: {
    heading: "KIOM DA RESPONDOJ?",
    normal: "Normala reĝimo",
    normalCopy:
      "Pluraj homoj povas respondi per la sama ligilo. Ĉiuj respondoj videblas ĝis la ligilo eksvalidiĝas aŭ vi forigas ilin.",
    once: "Vidi unufoje",
    onceCopy:
      "Nur la unua respondo estas akceptata. Ĝi restas sigelita; per “Vidi kaj detrui” la invito kaj respondo estas forigitaj el la aktiva datumbazo.",
    selected: "ELEKTITA",
  },
  pt: {
    heading: "QUANTAS RESPOSTAS?",
    normal: "Modo normal",
    normalCopy:
      "Várias pessoas podem responder pelo mesmo link. Verás todas as respostas até o link expirar ou até as eliminares.",
    once: "Ver uma vez",
    onceCopy:
      "Só é aceite a primeira resposta. Fica selada e, ao tocar em «Ver e destruir», o convite e a resposta são eliminados da base de dados ativa.",
    selected: "SELECIONADO",
  },
  zh: {
    heading: "允许多少份回答？",
    normal: "普通模式",
    normalCopy:
      "多人可以使用同一链接回答。所有回答会保留到链接到期或你主动删除。",
    once: "仅看一次",
    onceCopy:
      "只接受第一份回答。回答会保持密封；点击“查看并销毁”后，邀请和回答将从活跃数据库中删除。",
    selected: "已选择",
  },
  hi: {
    heading: "कितने जवाब?",
    normal: "सामान्य मोड",
    normalCopy:
      "एक ही लिंक से कई लोग जवाब दे सकते हैं। लिंक की अवधि खत्म होने या आपके मिटाने तक सभी जवाब दिखेंगे।",
    once: "एक बार देखें",
    onceCopy:
      "सिर्फ पहला जवाब स्वीकार होगा। वह सील रहेगा; “देखें और मिटाएँ” दबाने पर आमंत्रण और जवाब सक्रिय डेटाबेस से मिट जाते हैं।",
    selected: "चुना गया",
  },
  ja: {
    heading: "回答数は？",
    normal: "通常モード",
    normalCopy:
      "同じリンクから複数人が回答できます。期限切れまたは削除するまで、すべての回答を確認できます。",
    once: "一度だけ見る",
    onceCopy:
      "最初の1件だけ受け付けます。回答は封印され、「表示して削除」を押すと招待と回答がアクティブデータベースから削除されます。",
    selected: "選択中",
  },
  tr: {
    heading: "KAÇ YANIT?",
    normal: "Normal mod",
    normalCopy:
      "Aynı bağlantıyla birden fazla kişi yanıt verebilir. Bağlantı sona erene veya sen silene kadar tüm yanıtları görürsün.",
    once: "Bir kez görüntüle",
    onceCopy:
      "Yalnızca ilk yanıt kabul edilir. Yanıt mühürlü kalır; “Görüntüle ve yok et” seçilince davet ve yanıt aktif veritabanından silinir.",
    selected: "SEÇİLDİ",
  },
  machine: {
    heading: "RESPONSE_CARDINALITY",
    normal: "MULTI_RESPONSE",
    normalCopy: "same_link accepts N responses UNTIL expiry OR creator_delete.",
    once: "SINGLE_CONSUME",
    onceCopy:
      "accept FIRST only; keep SEALED; on creator_consume DELETE invitation+response FROM active_db.",
    selected: "SELECTED",
  },
});
const timedModeCopy = localized<{ title: string; copy: string }>({
  en: {
    title: "Express challenge · only 15 seconds",
    copy: "The recipient has only 15 seconds to answer each question and must acknowledge this twice before starting. At zero, what they typed is locked and the next question opens. They cannot go back.",
  },
  es: {
    title: "Reto exprés · solo 15 segundos",
    copy: "La persona tendrá solo 15 segundos para responder cada pregunta y deberá confirmarlo dos veces antes de empezar. Al llegar a cero, se guarda lo escrito y se abre la siguiente pregunta. No podrá volver atrás.",
  },
  it: {
    title: "Sfida express · solo 15 secondi",
    copy: "Chi risponde ha solo 15 secondi per domanda e deve confermarlo due volte prima di iniziare. A zero, il testo viene bloccato e si apre la domanda successiva. Non può tornare indietro.",
  },
  fr: {
    title: "Défi express · 15 secondes seulement",
    copy: "La personne ne dispose que de 15 secondes par question et doit le confirmer deux fois avant de commencer. À zéro, son texte est verrouillé et la question suivante s’ouvre. Impossible de revenir en arrière.",
  },
  de: {
    title: "Express-Challenge · nur 15 Sekunden",
    copy: "Die antwortende Person hat nur 15 Sekunden pro Frage und muss dies vor dem Start zweimal bestätigen. Bei null wird der Text gesperrt und die nächste Frage geöffnet. Zurückgehen ist nicht möglich.",
  },
  nl: {
    title: "Express-uitdaging · slechts 15 seconden",
    copy: "De ontvanger krijgt slechts 15 seconden per vraag en moet dit vóór de start twee keer bevestigen. Bij nul wordt de tekst vastgezet en opent de volgende vraag. Teruggaan kan niet.",
  },
  eo: {
    title: "Rapida defio · nur 15 sekundoj",
    copy: "La respondanto ricevas nur 15 sekundojn por ĉiu demando kaj devas tion konfirmi dufoje antaŭ la komenco. Je nulo la tajpita teksto fiksiĝas kaj la sekva demando malfermiĝas. Reiri ne eblas.",
  },
  pt: {
    title: "Desafio expresso · apenas 15 segundos",
    copy: "A pessoa terá apenas 15 segundos por pergunta e terá de o confirmar duas vezes antes de começar. Ao chegar a zero, o texto fica bloqueado e abre-se a pergunta seguinte. Não é possível voltar atrás.",
  },
  zh: {
    title: "极速挑战 · 每题仅 15 秒",
    copy: "回答者每题只有 15 秒，开始前必须确认两次。倒计时归零时，已输入内容会被锁定并自动进入下一题，无法返回。",
  },
  hi: {
    title: "एक्सप्रेस चुनौती · केवल 15 सेकंड",
    copy: "जवाब देने वाले को हर सवाल के लिए केवल 15 सेकंड मिलेंगे और शुरू करने से पहले उसे दो बार इसकी पुष्टि करनी होगी। समय समाप्त होने पर लिखा हुआ जवाब लॉक होगा और अगला सवाल खुलेगा। वापस नहीं जा सकेंगे।",
  },
  ja: {
    title: "エクスプレスチャレンジ・1問15秒のみ",
    copy: "回答者は1問につき15秒しかなく、開始前に2回確認する必要があります。0秒になると入力内容が確定し、次の質問へ自動で進みます。前には戻れません。",
  },
  tr: {
    title: "Ekspres meydan okuma · yalnızca 15 saniye",
    copy: "Yanıtlayan kişinin her soru için yalnızca 15 saniyesi vardır ve başlamadan önce bunu iki kez onaylaması gerekir. Süre sıfırlanınca yazılanlar kilitlenir ve sonraki soru açılır. Geri dönülemez.",
  },
  machine: {
    title: "MODE::15S_PER_QUESTION",
    copy: "REQUIRE acknowledgements=2 BEFORE start; deadline=15s EACH; ON timeout LOCK current_input; ADVANCE; navigation.back=false",
  },
});
const successFlowCopy = localized<string>({
  en: "Send {name} either the answer link or the invitation QR. If you enabled the optional key, send it separately. Encrypted answers will only appear in your private dashboard.",
  es: "Envía a {name} el enlace o el QR de invitación: basta con uno. Si activaste la llave opcional, envíala por separado. Las respuestas cifradas aparecerán únicamente en tu panel privado.",
  it: "Invia a {name} il link o il QR dell'invito: ne basta uno. Se hai attivato la chiave opzionale, inviala separatamente. Le risposte cifrate appariranno solo nel tuo pannello privato.",
  fr: "Envoyez à {name} le lien ou le QR d'invitation : un seul suffit. Si la clé facultative est activée, envoyez-la séparément. Les réponses chiffrées apparaîtront uniquement dans votre espace privé.",
  de: "Sende {name} entweder den Einladungslink oder den QR; einer genügt. Sende den optionalen Schlüssel getrennt. Verschlüsselte Antworten erscheinen nur in deinem privaten Bereich.",
  nl: "Stuur {name} de uitnodigingslink of -QR; één is genoeg. Stuur de optionele sleutel apart. Versleutelde antwoorden verschijnen alleen in je privédashboard.",
  eo: "Sendu al {name} la invitan ligilon aŭ QR; unu sufiĉas. Sendu la nedevigan ŝlosilon aparte. Ĉifritaj respondoj aperos nur en via privata panelo.",
  pt: "Envia a {name} o link ou QR do convite; basta um. Envia a chave opcional separadamente. As respostas cifradas aparecerão apenas no teu painel privado.",
  zh: "向 {name} 发送邀请链接或邀请二维码，任选其一即可。若启用了可选密钥，请分开发送。加密回答只会出现在你的私人面板中。",
  hi: "{name} को निमंत्रण लिंक या QR में से एक भेजें। वैकल्पिक कुंजी चालू हो तो उसे अलग भेजें। एन्क्रिप्टेड जवाब केवल आपके निजी डैशबोर्ड में दिखेंगे।",
  ja: "{name}さんには招待リンクか招待QRのどちらか一方を送ります。任意の鍵を有効にした場合は別に送ってください。暗号化された回答は非公開パネルだけに表示されます。",
  tr: "{name} kişisine davet bağlantısını veya QR'ını gönder; biri yeterlidir. İsteğe bağlı anahtarı ayrı gönder. Şifreli yanıtlar yalnızca özel panelinde görünür.",
  machine: "SEND invitation_url XOR invitation_qr TO {name}; IF shared_key THEN separate_channel; ciphertext.visible_at=creator_dashboard_only",
});
const panelShareCopy = localized<{ button: string; hint: string }>({
  en: { button: "Share my panel on WhatsApp", hint: "Send this to yourself so you can keep the private dashboard link in your own WhatsApp chat." },
  es: { button: "Compartir mi panel por WhatsApp", hint: "Envíatelo a ti mismo para guardar el enlace del panel privado en tu propio chat de WhatsApp." },
  it: { button: "Condividi il mio pannello su WhatsApp", hint: "Invialo a te stesso per conservare il link del pannello privato nella tua chat WhatsApp." },
  fr: { button: "Partager mon espace sur WhatsApp", hint: "Envoyez-le à vous-même pour conserver le lien privé dans votre propre conversation WhatsApp." },
  de: { button: "Meinen Bereich über WhatsApp teilen", hint: "Sende ihn an dich selbst, damit der private Dashboard-Link in deinem eigenen WhatsApp-Chat bleibt." },
  nl: { button: "Mijn dashboard delen via WhatsApp", hint: "Stuur het naar jezelf om de privélink in je eigen WhatsApp-chat te bewaren." },
  eo: { button: "Kunhavigi mian panelon per WhatsApp", hint: "Sendu ĝin al vi mem por konservi la privatan panelan ligilon en via propra WhatsApp-babilejo." },
  pt: { button: "Partilhar o meu painel no WhatsApp", hint: "Envia-o para ti próprio para guardares o link do painel privado na tua conversa do WhatsApp." },
  zh: { button: "通过 WhatsApp 分享我的面板", hint: "请发送给自己，把私人面板链接保存在自己的 WhatsApp 对话中。" },
  hi: { button: "WhatsApp पर मेरा डैशबोर्ड साझा करें", hint: "इसे खुद को भेजें, ताकि निजी डैशबोर्ड लिंक आपके अपने WhatsApp चैट में सुरक्षित रहे।" },
  ja: { button: "WhatsAppで自分のパネルを共有", hint: "自分宛てに送り、非公開パネルのリンクを自分のWhatsAppチャットに保存してください。" },
  tr: { button: "Panelimi WhatsApp'ta paylaş", hint: "Özel panel bağlantısını kendi WhatsApp sohbetinde saklamak için kendine gönder." },
  machine: { button: "SHARE admin_url VIA whatsapp:// TO SELF", hint: "recipient=self; preserve=private_dashboard_url" },
});
void growthCopy;
const paymentCopy = localized<{ title: string; copy: string; soon: string }>({
  en: {
    title: "Custom background + advanced stats · $0.99",
    copy: "One-tap Apple Pay / Google Pay",
    soon: "NOT ACTIVE YET",
  },
  es: {
    title: "Fondo personalizado + estadísticas · 0,50 €",
    copy: "Apple Pay / Google Pay en un toque",
    soon: "AÚN NO ACTIVO",
  },
  it: {
    title: "Sfondo personalizzato + statistiche · 0,50 €",
    copy: "Apple Pay / Google Pay con un tocco",
    soon: "NON ANCORA ATTIVO",
  },
  fr: {
    title: "Fond personnalisé + statistiques · 0,50 €",
    copy: "Apple Pay / Google Pay en un geste",
    soon: "PAS ENCORE ACTIF",
  },
  de: {
    title: "Eigenes Hintergrundbild + Statistiken · 0,50 €",
    copy: "Apple Pay / Google Pay mit einem Tippen",
    soon: "NOCH NICHT AKTIV",
  },
  nl: {
    title: "Eigen achtergrond + uitgebreide statistieken · € 0,50",
    copy: "Apple Pay / Google Pay met één tik",
    soon: "NOG NIET ACTIEF",
  },
  eo: {
    title: "Propra fono + detalaj statistikoj · 0,50 €",
    copy: "Apple Pay / Google Pay per unu tuŝo",
    soon: "ANKORAŬ NE AKTIVA",
  },
  pt: {
    title: "Fundo personalizado + estatísticas avançadas · 0,50 €",
    copy: "Apple Pay / Google Pay com um toque",
    soon: "AINDA NÃO ATIVO",
  },
  zh: {
    title: "自定义背景 + 高级统计 · $0.99",
    copy: "Apple Pay / Google Pay 一键支付",
    soon: "尚未启用",
  },
  hi: {
    title: "कस्टम बैकग्राउंड + उन्नत आँकड़े · $0.99",
    copy: "एक टैप में Apple Pay / Google Pay",
    soon: "अभी सक्रिय नहीं",
  },
  ja: {
    title: "カスタム背景＋詳細統計・$0.99",
    copy: "Apple Pay / Google Payでワンタップ決済",
    soon: "まだ利用できません",
  },
  tr: {
    title: "Özel arka plan + gelişmiş istatistikler · $0.99",
    copy: "Tek dokunuşla Apple Pay / Google Pay",
    soon: "HENÜZ AKTİF DEĞİL",
  },
  machine: {
    title: "custom_background+advanced_stats; price=0.99",
    copy: "payment=apple_pay|google_pay; taps=1",
    soon: "STATUS=DISABLED",
  },
});
void paymentCopy;
const encryptionCopy = localized<Record<"notice", string>>({
  en: {
    notice:
      "End-to-end encrypted: audited servers receive ciphertext, not private content. The complete link opens the invitation; an optional shared key can add a separately delivered second secret. Z4SK cannot recover either one.",
  },
  es: {
    notice:
      "Cifrado de extremo a extremo: los servidores auditados reciben texto cifrado. El enlace completo abre la invitación; una llave opcional puede añadir un segundo secreto enviado aparte. Z4SK no puede recuperar ninguno.",
  },
  it: {
    notice:
      "Crittografia end-to-end: il link completo apre l'invito; una chiave facoltativa può aggiungere un secondo segreto separato. Z4SK non può recuperare né link né chiave.",
  },
  fr: {
    notice:
      "Chiffrement de bout en bout : le lien complet ouvre l'invitation ; une clé facultative peut ajouter un second secret transmis séparément. Z4SK ne peut récupérer ni l'un ni l'autre.",
  },
  de: {
    notice:
      "Ende-zu-Ende-verschlüsselt: Der vollständige Link öffnet die Einladung; ein optionaler Schlüssel kann ein getrennt übermitteltes zweites Geheimnis hinzufügen. Z4SK kann beides nicht wiederherstellen.",
  },
  nl: {
    notice:
      "End-to-end versleuteld: de volledige link opent de uitnodiging; een optionele sleutel kan een apart gedeeld tweede geheim toevoegen. Z4SK kan geen van beide herstellen.",
  },
  eo: {
    notice:
      "Fine-al-fina ĉifrado: la plena ligilo malfermas la inviton; nedeviga ŝlosilo povas aldoni aparte senditan duan sekreton. Z4SK ne povas reakiri ilin.",
  },
  pt: {
    notice:
      "Cifrado de ponta a ponta: o link completo abre o convite; uma chave opcional pode adicionar um segundo segredo enviado separadamente. O Z4SK não recupera nenhum deles.",
  },
  zh: {
    notice:
      "端到端加密：完整链接可打开邀请；可选共享密钥可增加一个另行传递的秘密。Z4SK 无法恢复链接或密钥。",
  },
  hi: {
    notice:
      "एंड-टू-एंड एन्क्रिप्शन: पूरा लिंक निमंत्रण खोलता है; वैकल्पिक साझा कुंजी अलग से दिया गया दूसरा रहस्य जोड़ सकती है। Z4SK दोनों में से किसी को वापस नहीं ला सकता।",
  },
  ja: {
    notice:
      "エンドツーエンド暗号化：完全なリンクで招待を開けます。任意の共有鍵を使うと、別経路の第二の秘密を追加できます。Z4SKはどちらも復元できません。",
  },
  tr: {
    notice:
      "Uçtan uca şifreleme: tam bağlantı daveti açar; isteğe bağlı paylaşılan anahtar ayrı iletilen ikinci bir sır ekleyebilir. Z4SK ikisini de kurtaramaz.",
  },
  machine: {
    notice:
      "E2EE=true; decrypt.requires=link_secret; shared_key.optional=true; IF shared_key THEN transport=separate_channel; server.shared_key=false; recovery=false",
  },
});
const builderUi = localized<{
  done: string;
  remove: string;
  security: string;
}>({
  en: { done: "Done", remove: "Remove {question}", security: "Continue to security" },
  es: { done: "Listo", remove: "Eliminar {question}", security: "Continuar a seguridad" },
  it: { done: "Fatto", remove: "Rimuovi {question}", security: "Continua alla sicurezza" },
  fr: { done: "Terminé", remove: "Supprimer {question}", security: "Continuer vers la sécurité" },
  de: { done: "Fertig", remove: "{question} entfernen", security: "Weiter zur Sicherheit" },
  nl: { done: "Klaar", remove: "{question} verwijderen", security: "Verder naar beveiliging" },
  eo: { done: "Farite", remove: "Forigi {question}", security: "Daŭrigi al sekureco" },
  pt: { done: "Concluído", remove: "Remover {question}", security: "Continuar para a segurança" },
  zh: { done: "完成", remove: "移除 {question}", security: "继续安全设置" },
  hi: { done: "हो गया", remove: "{question} हटाएँ", security: "सुरक्षा पर जाएँ" },
  ja: { done: "完了", remove: "{question}を削除", security: "セキュリティへ進む" },
  tr: { done: "Bitti", remove: "{question} sorusunu kaldır", security: "Güvenliğe devam et" },
  machine: { done: "DONE", remove: "REMOVE::{question}", security: "SECURITY_NEXT" },
});

export function Builder({ onClose }: { onClose?: () => void }) {
  const { locale, t } = useLanguage();
  const shellRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(1);
  const [creatorName, setCreatorName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [level, setLevel] = useState<Level>("coqueto");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(12);
  const [packSlug, setPackSlug] = useState("original");
  const [selected, setSelected] = useState<string[]>(() =>
    getDefaultQuestions(locale, "coqueto"),
  );
  const [custom, setCustom] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"play" | "admin" | null>(null);
  const [sharedKey, setSharedKey] = useState("");
  const [sharedKeyConfirmed, setSharedKeyConfirmed] = useState(false);
  const [linkOnlyConfirmed, setLinkOnlyConfirmed] = useState(false);
  const questions = getQuestions(locale, level);
  const identityValid =
    creatorName.trim().length >= 1 &&
    recipientName.trim().length >= 1;
  const intensityValid = level !== "sinfiltro" || adultConfirmed;

  useEffect(() => {
    const dialog = shellRef.current?.closest<HTMLElement>(".builder-dialog");
    dialog?.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => {
      const target =
        step === 1
          ? shellRef.current?.querySelector<HTMLElement>("#creator")
          : step === 5
          ? shellRef.current?.querySelector<HTMLElement>(".success-panel h3")
          : headingRef.current;
      target?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  function chooseLevel(next: Level) {
    setLevel(next);
    setSelected(getDefaultQuestions(locale, next));
  }
  function toggleQuestion(question: string) {
    setSelected((current) =>
      current.includes(question)
        ? current.filter((item) => item !== question)
        : current.length < 12
          ? [...current, question]
          : current,
    );
  }
  function addCustom() {
    const value = custom.trim().replace(/\s+/g, " ");
    if (
      value.length >= 5 &&
      value.length <= 180 &&
      !selected.includes(value) &&
      selected.length < 12
    ) {
      setSelected((current) => [...current, value]);
      setCustom("");
    }
  }

  async function createGame(
    overrides?: { sharedKey?: string; linkOnly?: boolean },
  ) {
    setError("");
    try {
      const activeSharedKey = overrides?.sharedKey ?? sharedKey;
      const activeLinkOnly = overrides?.linkOnly ?? linkOnlyConfirmed;
      if (!activeSharedKey && !activeLinkOnly)
        throw new Error(SHARED_KEY_COPY[locale].chooseRequired);
      if (activeSharedKey && !sharedKeyConfirmed && !overrides?.sharedKey)
        throw new Error(SHARED_KEY_COPY[locale].confirm);
      const normalizedCreatorName = creatorName.trim().replace(/\s+/g, " ");
      const normalizedRecipientName = recipientName.trim().replace(/\s+/g, " ");
      const [encryptionKeys, access, submissionAccess] = await Promise.all([
        generateResponseKeyPair(),
        generateCreatorAccessCredential(),
        generateCreatorAccessCredential(),
      ]);
      const invitationSecret = generateInvitationSecret();
      const expectedKeyMode = activeLinkOnly ? "link" : "shared";
      const encryptedInvitation = await encryptPrivateInvitation(
        {
          creatorName: normalizedCreatorName,
          recipientName: normalizedRecipientName,
          title: `${normalizedRecipientName} · Z4SK`,
          level,
          questions: selected,
          locale,
          libraryVersion: "2026.11",
          timedMode,
          packSlug,
          encryptionPublicKey: encryptionKeys.publicKey,
          createdAt: new Date().toISOString(),
        },
        invitationSecret,
        activeSharedKey,
      );
      if (encryptedInvitation.keyMode !== expectedKeyMode)
        throw new Error(SHARED_KEY_COPY[locale].chooseRequired);
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          encryptedInvitation,
          keyMode: expectedKeyMode,
          questionCount: selected.length,
          viewOnce,
          expiresInHours,
          creatorTokenHash: access.tokenHash,
          submissionTokenHash: submissionAccess.tokenHash,
        }),
      });
      const data = (await response.json()) as Omit<Created, "adminUrl"> & {
        error?: string;
      };
      if (!response.ok) throw new Error(t("formError"));
      const playUrl = attachInvitationSecret(
        attachSubmissionToken(data.playUrl, submissionAccess.token),
        invitationSecret,
      );
      const privateUrl = attachInvitationSecret(
        `${window.location.origin}/p/${data.id}#key=${encodeURIComponent(access.token)}`,
        invitationSecret,
      );
      setCreatorName(normalizedCreatorName);
      setRecipientName(normalizedRecipientName);
      setCreated({
        ...data,
        playUrl,
        adminUrl: attachPrivateDecryptionKey(
          privateUrl,
          encryptionKeys.privateSecret,
        ),
      });
      setStep(5);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("formError"));
    }
  }

  async function copy(value: string, type: "play" | "admin") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  }
  function sharePrivatePanel() {
    if (!created) return;
    const c = panelShareCopy[locale];
    const message = `${c.hint}\n\n${created.adminUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  const displayedStep = step === 4 ? 5 : step;
  const totalSteps = 5;
  return (
    <div ref={shellRef} className={`builder-shell builder-theme-${packSlug}`}>
      {step <= 4 && <>
      <div className="builder-top" aria-live="polite">
        <div>
          <span className="step">
            {t("step")} {displayedStep} {t("of")} {totalSteps}
          </span>
          <h2 ref={headingRef} id="builder-title" tabIndex={-1}>
            {step === 1
              ? t("who")
              : step === 2
                ? t("chooseIntensity")
                : step === 3
                  ? t("chooseQuestions")
                  : SHARED_KEY_COPY[locale].protectTitle}
          </h2>
        </div>
        <span className="counter">0{displayedStep}</span>
      </div>
      <progress
        className="steps-line"
        max={totalSteps}
        value={displayedStep}
        aria-label={`${t("step")} ${displayedStep} ${t("of")} ${totalSteps}`}
      />
      </>}
      {step === 1 && (
        <div className="step-panel identity-step">
          <div className="two-fields">
            <div>
              <label htmlFor="creator">{t("yourName")}</label>
              <input
                id="creator"
                required
                minLength={1}
                maxLength={40}
                autoComplete="name"
                aria-describedby="creator-name-rule"
                value={creatorName}
                onChange={(event) =>
                  setCreatorName(event.target.value.slice(0, 40))
                }
                placeholder={t("yourExample")}
              />
              <small id="creator-name-rule" className="name-rule">
                {NAME_RULE_COPY[locale]}
              </small>
            </div>
            <div>
              <label htmlFor="recipient">{t("theirName")}</label>
              <input
                id="recipient"
                required
                minLength={1}
                maxLength={40}
                autoComplete="off"
                aria-describedby="recipient-name-rule"
                value={recipientName}
                onChange={(event) =>
                  setRecipientName(event.target.value.slice(0, 40))
                }
                placeholder={t("theirExample")}
              />
              <small id="recipient-name-rule" className="name-rule">
                {NAME_RULE_COPY[locale]}
              </small>
            </div>
          </div>
          <button
            className="primary wizard-next"
            disabled={!identityValid}
            onClick={() => setStep(2)}
          >
            {t("chooseIntensity")} <span>→</span>
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="step-panel choice-step">
          <div className="choice-layout">
            <div>
              <fieldset className="intensity-fieldset">
                <legend>{t("chooseIntensity")}</legend>
                <div className="level-grid">
                  {getLevels(locale).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={level === item.id ? "active" : ""}
                      onClick={() => chooseLevel(item.id)}
                      aria-pressed={level === item.id}
                    >
                      <span className="level-icon">{item.icon}</span>
                      <span>
                        <b>{item.label}</b>
                        <small>{item.copy}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {level === "sinfiltro" && (
                <label className="age-check">
                  <input
                    type="checkbox"
                    checked={adultConfirmed}
                    onChange={(event) => setAdultConfirmed(event.target.checked)}
                  />
                  <span>{t("adultConfirm")}</span>
                </label>
              )}
            </div>
            <ResponseMode
              locale={locale}
              viewOnce={viewOnce}
              setViewOnce={setViewOnce}
            />
          </div>
          <div className="button-row">
            <button className="secondary" onClick={() => setStep(1)}>
              ← {t("back")}
            </button>
            <button
              className="primary"
              disabled={!intensityValid}
              onClick={() => setStep(3)}
            >
              {t("chooseQuestionsBtn")} <span>→</span>
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="questions-step-layout">
          <FeatureConfig
            locale={locale}
            timedMode={timedMode}
            setTimedMode={setTimedMode}
            expiresInHours={expiresInHours}
            setExpiresInHours={setExpiresInHours}
            packSlug={packSlug}
            setPackSlug={setPackSlug}
          />
          <div className="step-panel questions-panel">
            <div className="selection-meta">
              <div>
                <p>{t("selectHint")}</p>
              </div>
              <strong>{selected.length}/12</strong>
            </div>
            <div className="questions-list">
              {questions.map((question, index) => (
                <button
                  type="button"
                  key={question}
                  className={selected.includes(question) ? "selected" : ""}
                  onClick={() => toggleQuestion(question)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{question}</p>
                  <i>{selected.includes(question) ? "✓" : "+"}</i>
                </button>
              ))}
            </div>
            {selected
              .filter((item) => !questions.includes(item))
              .map((question) => (
                <div className="custom-chip" key={question}>
                  <span>{t("own")}</span>
                  <p>{question}</p>
                  <button
                    onClick={() => toggleQuestion(question)}
                    aria-label={interpolate(builderUi[locale].remove, {
                      question,
                    })}
                  >
                    ×
                  </button>
                </div>
              ))}
            <div className="custom-row">
              <input
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustom();
                  }
                }}
                maxLength={180}
                placeholder={t("customPlaceholder")}
              />
              <button type="button" onClick={addCustom}>
                {t("add")}
              </button>
            </div>
            <div className="button-row">
              <button className="secondary" onClick={() => setStep(2)}>
                ← {t("back")}
              </button>
              <button
                className="primary"
                disabled={selected.length < 3}
                onClick={() => setStep(4)}
              >
                {builderUi[locale].security}
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="step-panel security-step">
          <SharedKeySetup
            locale={locale}
            sharedKey={sharedKey}
            confirmed={sharedKeyConfirmed}
            linkOnly={linkOnlyConfirmed}
              onChange={(key) => {
              setSharedKey(key);
              setSharedKeyConfirmed(false);
              setLinkOnlyConfirmed(false);
            }}
            onConfirm={setSharedKeyConfirmed}
            onLinkOnly={setLinkOnlyConfirmed}
            onCreate={(key, linkOnly) => void createGame({ sharedKey: key, linkOnly })}
          />
          {sharedKeyConfirmed && (
            <p
              id="security-requirement"
              className="security-requirement ready"
              aria-live="polite"
            >
              {SHARED_KEY_COPY[locale].ready}
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="button-row security-back-row">
            <button className="secondary" onClick={() => setStep(3)}>
              ← {t("back")}
            </button>
          </div>
        </div>
      )}
      {step === 5 && created && (
        <div className="success-panel">
          <header className="success-hero">
            <div className="success-icon">✓</div>
            <span className="success-kicker">{t("created")}</span>
            <h3 id="builder-title" tabIndex={-1}>
              {t("interesting")}
            </h3>
            <p>
              {interpolate(successFlowCopy[locale], { name: recipientName })}
            </p>
          </header>
          {sharedKey && (
            <a className="success-key-status" href="#success-shared-key">
              <span>✓</span>
              <div>
                <strong>{SHARED_KEY_COPY[locale].ready}</strong>
                <small>{SHARED_KEY_COPY[locale].differentChannel}</small>
              </div>
              <b>{SHARED_KEY_COPY[locale].cardTitle} ↓</b>
            </a>
          )}
          <div className="success-delivery-grid">
            <div className="success-share-column">
              <ShareInvitation
                locale={locale}
                recipientName={recipientName}
                playUrl={created.playUrl}
                shareText={t("shareText")}
                protectedBySharedKey={Boolean(sharedKey)}
              />
              <div className="link-box">
                <span>{t("answerLink")}</span>
                <div>
                  <code>{created.playUrl}</code>
                  <button onClick={() => copy(created.playUrl, "play")}>
                    {copied === "play" ? t("copied") : t("copy")}
                  </button>
                </div>
              </div>
            </div>
            <QrCard
              kind="invitation"
              locale={locale}
              name={recipientName}
              url={created.playUrl}
              protectedBySharedKey={Boolean(sharedKey)}
            />
            <div className="success-private-column">
              <QrCard
                kind="dashboard"
                locale={locale}
                name={creatorName}
                url={created.adminUrl}
                protectedBySharedKey={Boolean(sharedKey)}
              />
              <div className="private-panel-actions">
                <b>{viewOnce ? t("privateOnce") : t("privatePanel")}</b>
                <span>{viewOnce ? t("privateOnceCopy") : t("secretCopy")}</span>
                <div className="admin-actions">
                  <a href={created.adminUrl} target="_blank" rel="noopener noreferrer">
                    {t("openPanel")}
                  </a>
                  <button onClick={() => copy(created.adminUrl, "admin")}>
                    {copied === "admin" ? t("copied") : t("copySecret")}
                  </button>
                  <button onClick={sharePrivatePanel}>
                    {panelShareCopy[locale].button}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {sharedKey ? (
            <section id="success-shared-key" className="success-shared-key">
              <SharedKeyCard
                locale={locale}
                sharedKey={sharedKey}
                showRecovery
              />
            </section>
          ) : (
            <div className="success-link-only-notice">
              <b>◇</b>
              <div>
                <strong>{SHARED_KEY_COPY[locale].linkOnlyReady}</strong>
                <p>{SHARED_KEY_COPY[locale].linkOnlyBody}</p>
              </div>
            </div>
          )}
          <p className="encryption-notice">
            <span>◆</span>
            {encryptionCopy[locale].notice}
          </p>
          <button
            className="text-button"
            onClick={() => {
              setCreated(null);
              setSharedKey("");
              setSharedKeyConfirmed(false);
              setLinkOnlyConfirmed(false);
              setStep(1);
            }}
          >
            {t("createAnother")}
          </button>
        </div>
      )}
      {step === 5 && created && onClose && (
        <button className="modal-done" type="button" onClick={onClose}>
          {builderUi[locale].done}
        </button>
      )}
    </div>
  );
}

function ResponseMode({
  locale,
  viewOnce,
  setViewOnce,
}: {
  locale: Locale;
  viewOnce: boolean;
  setViewOnce: (value: boolean) => void;
}) {
  const c = responseModeCopy[locale];
  return (
    <fieldset className="response-mode">
      <legend>{c.heading}</legend>
      <div className="response-mode-grid">
        <button
          type="button"
          className={!viewOnce ? "active" : ""}
          onClick={() => setViewOnce(false)}
          aria-pressed={!viewOnce}
        >
          <span className="response-mode-icon">◎</span>
          <span>
            <b>{c.normal}</b>
            <small>{c.normalCopy}</small>
          </span>
          {!viewOnce && <i>✓ {c.selected}</i>}
        </button>
        <button
          type="button"
          className={viewOnce ? "active once" : "once"}
          onClick={() => setViewOnce(true)}
          aria-pressed={viewOnce}
        >
          <span className="response-mode-icon">◉</span>
          <span>
            <b>{c.once}</b>
            <small>{c.onceCopy}</small>
          </span>
          {viewOnce && <i>✓ {c.selected}</i>}
        </button>
      </div>
    </fieldset>
  );
}

type FeatureText = {
  heading: string;
  intro: string;
  enable: string;
  enabled: string;
  expires: string;
  expiresCopy: string;
  hours: string;
  theme: string;
  themeCopy: string;
  original: string;
  nightlife: string;
  creator: string;
};
const featureText = localized<FeatureText>({
  en: {
    heading: "Optional settings",
    intro:
      "Choose how private, temporary and visual this invitation should be.",
    enable: "TURN ON",
    enabled: "ON",
    expires: "WHEN SHOULD IT DISAPPEAR?",
    expiresCopy:
      "After this time, the link stops working and its active data is deleted automatically.",
    hours: "hours",
    theme: "INVITATION STYLE",
    themeCopy:
      "Only changes the colors and mood. It does not affect questions or privacy.",
    original: "Original · Orange",
    nightlife: "Nightlife · Pink",
    creator: "Creator · Green",
  },
  es: {
    heading: "Ajustes opcionales",
    intro: "Elige cómo de privada, temporal y visual será esta invitación.",
    enable: "ACTIVAR",
    enabled: "ACTIVO",
    expires: "¿CUÁNDO DESAPARECE?",
    expiresCopy:
      "Al cumplirse este plazo, el enlace deja de funcionar y sus datos activos se eliminan automáticamente.",
    hours: "horas",
    theme: "ESTILO DE LA INVITACIÓN",
    themeCopy:
      "Solo cambia los colores y el ambiente. No afecta a las preguntas ni a la privacidad.",
    original: "Original · Naranja",
    nightlife: "Noche · Rosa",
    creator: "Creator · Verde",
  },
  it: {
    heading: "Impostazioni facoltative",
    intro:
      "Scegli quanto privata, temporanea e visiva sarà questa invitazione.",
    enable: "ATTIVA",
    enabled: "ATTIVO",
    expires: "QUANDO DEVE SPARIRE?",
    expiresCopy:
      "Dopo questo periodo, il link smette di funzionare e i dati attivi vengono eliminati automaticamente.",
    hours: "ore",
    theme: "STILE DELL'INVITO",
    themeCopy:
      "Cambia solo colori e atmosfera. Non modifica domande o privacy.",
    original: "Originale · Arancione",
    nightlife: "Notte · Rosa",
    creator: "Creator · Verde",
  },
  fr: {
    heading: "Réglages facultatifs",
    intro:
      "Choisissez le niveau de confidentialité, la durée et le style de cette invitation.",
    enable: "ACTIVER",
    enabled: "ACTIF",
    expires: "QUAND DOIT-ELLE DISPARAÎTRE ?",
    expiresCopy:
      "Après ce délai, le lien cesse de fonctionner et ses données actives sont supprimées automatiquement.",
    hours: "heures",
    theme: "STYLE DE L'INVITATION",
    themeCopy:
      "Change uniquement les couleurs et l'ambiance, pas les questions ni la confidentialité.",
    original: "Original · Orange",
    nightlife: "Nuit · Rose",
    creator: "Creator · Vert",
  },
  de: {
    heading: "Optionale Einstellungen",
    intro: "Lege Privatsphäre, Dauer und Aussehen dieser Einladung fest.",
    enable: "AKTIVIEREN",
    enabled: "AKTIV",
    expires: "WANN SOLL ES VERSCHWINDEN?",
    expiresCopy:
      "Danach funktioniert der Link nicht mehr und seine aktiven Daten werden automatisch gelöscht.",
    hours: "Stunden",
    theme: "EINLADUNGSSTIL",
    themeCopy:
      "Ändert nur Farben und Stimmung, nicht Fragen oder Privatsphäre.",
    original: "Original · Orange",
    nightlife: "Nacht · Pink",
    creator: "Creator · Grün",
  },
  nl: {
    heading: "Optionele instellingen",
    intro: "Kies hoe privé, tijdelijk en visueel deze uitnodiging is.",
    enable: "AANZETTEN",
    enabled: "AAN",
    expires: "WANNEER MOET DIT VERDWIJNEN?",
    expiresCopy:
      "Daarna werkt de link niet meer en worden de actieve gegevens automatisch verwijderd.",
    hours: "uur",
    theme: "STIJL VAN DE UITNODIGING",
    themeCopy: "Verandert alleen kleuren en sfeer, niet de vragen of privacy.",
    original: "Origineel · Oranje",
    nightlife: "Nacht · Roze",
    creator: "Creator · Groen",
  },
  eo: {
    heading: "Nedevigaj agordoj",
    intro: "Elektu la privatecon, daŭron kaj aspekton de ĉi tiu invito.",
    enable: "ŜALTI",
    enabled: "AKTIVA",
    expires: "KIAM ĜI MALAPERU?",
    expiresCopy:
      "Post tiu tempo la ligilo ĉesas funkcii kaj ĝiaj aktivaj datumoj aŭtomate foriĝas.",
    hours: "horoj",
    theme: "STILO DE LA INVITO",
    themeCopy:
      "Ŝanĝas nur la kolorojn kaj etoson, ne la demandojn aŭ privatecon.",
    original: "Originala · Oranĝa",
    nightlife: "Nokto · Rozkolora",
    creator: "Kreinto · Verda",
  },
  pt: {
    heading: "Definições opcionais",
    intro: "Escolhe quão privado, temporário e visual será este convite.",
    enable: "ATIVAR",
    enabled: "ATIVO",
    expires: "QUANDO DEVE DESAPARECER?",
    expiresCopy:
      "Depois deste prazo, o link deixa de funcionar e os dados ativos são eliminados automaticamente.",
    hours: "horas",
    theme: "ESTILO DO CONVITE",
    themeCopy:
      "Só muda as cores e o ambiente. Não afeta as perguntas nem a privacidade.",
    original: "Original · Laranja",
    nightlife: "Noite · Rosa",
    creator: "Creator · Verde",
  },
  zh: {
    heading: "可选设置",
    intro: "选择这份邀请的隐私程度、有效时间和视觉风格。",
    enable: "开启",
    enabled: "已开启",
    expires: "何时失效？",
    expiresCopy: "到期后，链接将停止工作，活跃数据会被自动删除。",
    hours: "小时",
    theme: "邀请风格",
    themeCopy: "只改变颜色和氛围，不影响问题或隐私。",
    original: "原版 · 橙色",
    nightlife: "夜色 · 粉色",
    creator: "创作者 · 绿色",
  },
  hi: {
    heading: "वैकल्पिक सेटिंग्स",
    intro: "इस आमंत्रण की गोपनीयता, अवधि और रूप चुनें।",
    enable: "चालू करें",
    enabled: "चालू",
    expires: "यह कब गायब हो?",
    expiresCopy:
      "इस समय के बाद लिंक काम करना बंद कर देगा और सक्रिय डेटा अपने आप मिट जाएगा।",
    hours: "घंटे",
    theme: "आमंत्रण की शैली",
    themeCopy: "सिर्फ रंग और माहौल बदलता है, सवाल या गोपनीयता नहीं।",
    original: "मूल · नारंगी",
    nightlife: "नाइट · गुलाबी",
    creator: "क्रिएटर · हरा",
  },
  ja: {
    heading: "オプション設定",
    intro: "招待のプライバシー、期限、見た目を選べます。",
    enable: "有効にする",
    enabled: "有効",
    expires: "いつ消えますか？",
    expiresCopy:
      "期限後はリンクが使えなくなり、アクティブデータは自動的に削除されます。",
    hours: "時間",
    theme: "招待のスタイル",
    themeCopy: "色と雰囲気だけを変更し、質問やプライバシーには影響しません。",
    original: "オリジナル・オレンジ",
    nightlife: "ナイト・ピンク",
    creator: "クリエイター・グリーン",
  },
  tr: {
    heading: "İsteğe bağlı ayarlar",
    intro: "Bu davetin gizliliğini, süresini ve görünümünü seç.",
    enable: "AÇ",
    enabled: "AÇIK",
    expires: "NE ZAMAN KAYBOLSUN?",
    expiresCopy:
      "Bu süreden sonra bağlantı çalışmaz ve aktif verileri otomatik olarak silinir.",
    hours: "saat",
    theme: "DAVET STİLİ",
    themeCopy:
      "Yalnızca renkleri ve havayı değiştirir; soruları veya gizliliği etkilemez.",
    original: "Orijinal · Turuncu",
    nightlife: "Gece · Pembe",
    creator: "Creator · Yeşil",
  },
  machine: {
    heading: "OPTIONAL_CONFIG",
    intro: "SET privacy_duration_visual_mode.",
    enable: "ENABLE",
    enabled: "ENABLED",
    expires: "TTL",
    expiresCopy: "ON expiry: LINK_DISABLED; ACTIVE_DATA_DELETE=AUTO.",
    hours: "hours",
    theme: "VISUAL_THEME",
    themeCopy: "COLOR_ONLY; QUESTIONS_UNCHANGED; PRIVACY_UNCHANGED.",
    original: "ORIGINAL_ORANGE",
    nightlife: "NIGHT_PINK",
    creator: "CREATOR_GREEN",
  },
});
const paletteLabels = localized<{
  ocean: string;
  solar: string;
  aurora: string;
  copper: string;
}>({
  en: { ocean: "Ocean · Blue", solar: "Solar · Coral", aurora: "Aurora · Teal", copper: "Forge · Copper" },
  es: { ocean: "Océano · Azul", solar: "Solar · Coral", aurora: "Aurora · Turquesa", copper: "Forja · Cobre" },
  it: { ocean: "Oceano · Blu", solar: "Solare · Corallo", aurora: "Aurora · Turchese", copper: "Forgia · Rame" },
  fr: { ocean: "Océan · Bleu", solar: "Solaire · Corail", aurora: "Aurore · Turquoise", copper: "Forge · Cuivre" },
  de: { ocean: "Ozean · Blau", solar: "Solar · Koralle", aurora: "Aurora · Türkis", copper: "Schmiede · Kupfer" },
  nl: { ocean: "Oceaan · Blauw", solar: "Solar · Koraal", aurora: "Aurora · Turquoise", copper: "Smederij · Koper" },
  eo: { ocean: "Oceano · Blua", solar: "Suna · Koralo", aurora: "Aŭroro · Turkiso", copper: "Forĝejo · Kupro" },
  pt: { ocean: "Oceano · Azul", solar: "Solar · Coral", aurora: "Aurora · Turquesa", copper: "Forja · Cobre" },
  zh: { ocean: "海洋 · 蓝", solar: "太阳 · 珊瑚", aurora: "极光 · 青绿", copper: "熔炉 · 铜" },
  hi: { ocean: "समुद्र · नीला", solar: "सौर · मूंगा", aurora: "ऑरोरा · फ़िरोज़ी", copper: "भट्ठी · तांबा" },
  ja: { ocean: "オーシャン・ブルー", solar: "ソーラー・コーラル", aurora: "オーロラ・ターコイズ", copper: "フォージ・カッパー" },
  tr: { ocean: "Okyanus · Mavi", solar: "Solar · Mercan", aurora: "Aurora · Turkuaz", copper: "Dövmehane · Bakır" },
  machine: { ocean: "OCEAN_BLUE", solar: "SOLAR_CORAL", aurora: "AURORA_TEAL", copper: "FORGE_COPPER" },
});
function FeatureConfig({
  locale,
  timedMode,
  setTimedMode,
  expiresInHours,
  setExpiresInHours,
  packSlug,
  setPackSlug,
}: {
  locale: Locale;
  timedMode: boolean;
  setTimedMode: (value: boolean) => void;
  expiresInHours: number;
  setExpiresInHours: (value: number) => void;
  packSlug: string;
  setPackSlug: (value: string) => void;
}) {
  const c = featureText[locale];
  return (
    <details open className="feature-config">
      <summary className="feature-intro">
        <span>✦</span>
        <div>
          <h3 id="feature-heading">{c.heading}</h3>
          <p>{c.intro}</p>
        </div>
        <i aria-hidden="true">+</i>
      </summary>
      <div className="feature-body">
      <button
        type="button"
        className={`blind-toggle timed-toggle ${timedMode ? "active" : ""}`}
        onClick={() => setTimedMode(!timedMode)}
        aria-pressed={timedMode}
      >
        <span>15</span>
        <div>
          <b>{timedModeCopy[locale].title}</b>
          <small>{timedModeCopy[locale].copy}</small>
        </div>
        <i>{timedMode ? c.enabled : c.enable}</i>
      </button>
      <div className="feature-selects">
        <label>
          {c.expires}
          <select
            value={expiresInHours}
            onChange={(event) => setExpiresInHours(Number(event.target.value))}
            aria-describedby="expiry-help"
          >
            {[12, 24, 48, 72].map((value) => (
              <option key={value} value={value}>
                {value} {c.hours}
              </option>
            ))}
          </select>
          <small id="expiry-help">{c.expiresCopy}</small>
        </label>
        <label>
          {c.theme}
          <select
            value={packSlug}
            onChange={(event) => setPackSlug(event.target.value)}
            aria-describedby="theme-help"
          >
            <option value="original">{c.original}</option>
            <option value="nightlife">{c.nightlife}</option>
            <option value="creator">{c.creator}</option>
            <option value="ocean">{paletteLabels[locale].ocean}</option>
            <option value="solar">{paletteLabels[locale].solar}</option>
            <option value="aurora">{paletteLabels[locale].aurora}</option>
            <option value="copper">{paletteLabels[locale].copper}</option>
          </select>
          <small id="theme-help">{c.themeCopy}</small>
        </label>
      </div>
      </div>
    </details>
  );
}
