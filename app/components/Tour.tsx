"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LOCALES, type Locale, useLanguage } from "../lib/i18n";

const TOUR_SEEN_KEY = "z4sk:tour-seen";
const TOUR_IMAGES = [
  "/z4sk-tour-create.png",
  "/z4sk-tour-shape.png",
  "/z4sk-tour-protect.png",
  "/z4sk-tour-share.png",
];

type TourStep = { eyebrow: string; title: string; copy: string };
type TourCopy = {
  title: string;
  intro: string;
  skip: string;
  back?: string;
  next: string;
  start: string;
  close: string;
  noMore: string;
  steps: TourStep[];
};

const copy: Record<Locale, TourCopy> = {
  en: { title: "A quick tour of Z4SK", intro: "Create something daring, share it privately, and let the answers come back to you.", skip: "Skip", back: "Back", next: "Next", start: "Start creating", close: "Close tour", noMore: "Don't show this again", steps: [{ eyebrow: "01 · CREATE", title: "Start with two names", copy: "Enter your name and theirs. Then choose the intensity so Z4SK can tune the questions to the mood you want." }, { eyebrow: "02 · SHAPE IT", title: "Make it yours", copy: "Pick at least three questions, add your own if you like, set when the invitation expires and preview the look they will receive." }, { eyebrow: "03 · PROTECT", title: "Add a second secret", copy: "Create a reusable Duo Key and keep one copy each, or choose the complete link when you do not need a separate key." }, { eyebrow: "04 · SHARE", title: "Send it and wait for the reply", copy: "Send either the invitation link or its QR. Keep your private-panel link for yourself: replies are encrypted and return there." }] },
  es: { title: "Un tour rápido por Z4SK", intro: "Crea algo atrevido, compártelo en privado y deja que las respuestas vuelvan a ti.", skip: "Saltar", back: "Volver", next: "Siguiente", start: "Empezar a crear", close: "Cerrar tour", noMore: "No volver a mostrar", steps: [{ eyebrow: "01 · CREA", title: "Empieza con dos nombres", copy: "Escribe tu nombre y el de la otra persona. Después elige la intensidad para ajustar las preguntas al tono que buscas." }, { eyebrow: "02 · DALE FORMA", title: "Hazlo tuyo", copy: "Elige al menos tres preguntas, añade las tuyas si quieres, fija la caducidad y previsualiza el estilo que recibirá la otra persona." }, { eyebrow: "03 · PROTEGE", title: "Añade un segundo secreto", copy: "Crea una Llave Duo reutilizable y guardad una copia cada uno, o usa el enlace completo si no necesitas una llave separada." }, { eyebrow: "04 · COMPARTE", title: "Envíalo y espera la respuesta", copy: "Envía el enlace de invitación o su QR. Guarda para ti el enlace de tu panel privado: las respuestas cifradas volverán allí." }] },
  it: { title: "Un tour rapido di Z4SK", intro: "Crea qualcosa di audace, condividilo in privato e lascia che le risposte tornino a te.", skip: "Salta", next: "Avanti", start: "Inizia a creare", close: "Chiudi tour", noMore: "Non mostrare più", steps: [{ eyebrow: "01 · CREA", title: "Inizia con due nomi", copy: "Imposta il tono con il tuo nome, il suo e un’intensità adatta." }, { eyebrow: "02 · DAI FORMA", title: "Rendilo tuo", copy: "Scegli le domande, aggiungine di tue, imposta la scadenza e lo stile." }, { eyebrow: "03 · PROTEGGI", title: "Aggiungi un secondo segreto", copy: "Usa una Chiave Duo riutilizzabile oppure continua con il link completo." }, { eyebrow: "04 · CONDIVIDI", title: "Invia un piccolo segreto", copy: "Condividi il link o il QR. Le risposte tornano cifrate nel tuo pannello privato." }] },
  fr: { title: "Visite express de Z4SK", intro: "Créez quelque chose d’audacieux, partagez-le en privé et recevez les réponses.", skip: "Passer", next: "Suivant", start: "Commencer", close: "Fermer le tour", noMore: "Ne plus afficher", steps: [{ eyebrow: "01 · CRÉER", title: "Commencez par deux noms", copy: "Choisissez le ton avec votre nom, le sien et une intensité adaptée." }, { eyebrow: "02 · FAÇONNER", title: "Faites-le vôtre", copy: "Choisissez les questions, ajoutez les vôtres, fixez l’expiration et le style." }, { eyebrow: "03 · PROTÉGER", title: "Ajoutez un second secret", copy: "Utilisez une Clé Duo réutilisable ou continuez avec le lien complet." }, { eyebrow: "04 · PARTAGER", title: "Envoyez un petit secret", copy: "Partagez le lien ou le QR. Les réponses reviennent chiffrées dans votre espace." }] },
  de: { title: "Ein kurzer Z4SK-Rundgang", intro: "Erstelle etwas Gewagtes, teile es privat und lass die Antworten zu dir zurückkommen.", skip: "Überspringen", next: "Weiter", start: "Jetzt erstellen", close: "Tour schließen", noMore: "Nicht wieder anzeigen", steps: [{ eyebrow: "01 · ERSTELLEN", title: "Beginne mit zwei Namen", copy: "Lege mit deinem Namen, dem anderen Namen und der passenden Intensität den Ton fest." }, { eyebrow: "02 · GESTALTEN", title: "Mach es zu deinem", copy: "Wähle Fragen, füge eigene hinzu, setze den Ablauf und sieh den Stil vorher an." }, { eyebrow: "03 · SCHÜTZEN", title: "Füge ein zweites Geheimnis hinzu", copy: "Nutze einen wiederverwendbaren Duo-Schlüssel oder den vollständigen Link." }, { eyebrow: "04 · TEILEN", title: "Sende ein kleines Geheimnis", copy: "Teile Link oder QR. Antworten kommen verschlüsselt in deinen privaten Bereich zurück." }] },
  nl: { title: "Een korte Z4SK-tour", intro: "Maak iets uitdagends, deel het privé en laat de antwoorden naar jou terugkomen.", skip: "Overslaan", next: "Volgende", start: "Beginnen", close: "Tour sluiten", noMore: "Niet meer tonen", steps: [{ eyebrow: "01 · MAKEN", title: "Begin met twee namen", copy: "Bepaal de sfeer met jouw naam, de andere naam en een passende intensiteit." }, { eyebrow: "02 · VORMGEVEN", title: "Maak het van jou", copy: "Kies vragen, voeg eigen vragen toe, stel de vervaldatum in en bekijk de stijl." }, { eyebrow: "03 · BESCHERMEN", title: "Voeg een tweede geheim toe", copy: "Gebruik een herbruikbare Duo-sleutel of ga verder met de volledige link." }, { eyebrow: "04 · DELEN", title: "Stuur een klein geheim", copy: "Deel de link of QR. Antwoorden komen versleuteld terug in je privédashboard." }] },
  eo: { title: "Rapida turneo de Z4SK", intro: "Kreu ion aŭdacan, dividu ĝin private kaj ricevu la respondojn reen.", skip: "Preterpasi", next: "Sekva", start: "Komenci", close: "Fermi turneon", noMore: "Ne plu montri", steps: [{ eyebrow: "01 · KREU", title: "Komencu per du nomoj", copy: "Agordu la tonon per via nomo, la alia nomo kaj taŭga intenseco." }, { eyebrow: "02 · FORMU", title: "Faru ĝin via", copy: "Elektu demandojn, aldonu viajn, agordu eksvalidiĝon kaj antaŭrigardu la stilon." }, { eyebrow: "03 · PROTEKTU", title: "Aldonu duan sekreton", copy: "Uzu reuzeblan Duo-ŝlosilon aŭ daŭrigu per la plena ligilo." }, { eyebrow: "04 · DIVIDU", title: "Sendu etan sekreton", copy: "Dividu la ligilon aŭ QR. Respondoj revenas ĉifritaj en via privata panelo." }] },
  pt: { title: "Uma visita rápida ao Z4SK", intro: "Cria algo ousado, partilha em privado e deixa as respostas voltar para ti.", skip: "Saltar", next: "Seguinte", start: "Começar a criar", close: "Fechar visita", noMore: "Não mostrar novamente", steps: [{ eyebrow: "01 · CRIAR", title: "Começa com dois nomes", copy: "Define o tom com o teu nome, o da outra pessoa e uma intensidade adequada." }, { eyebrow: "02 · MOLDAR", title: "Torna-o teu", copy: "Escolhe perguntas, acrescenta as tuas, define a validade e vê o estilo." }, { eyebrow: "03 · PROTEGER", title: "Adiciona um segundo segredo", copy: "Usa uma Chave Duo reutilizável ou continua com o link completo." }, { eyebrow: "04 · PARTILHAR", title: "Envia um pequeno segredo", copy: "Partilha o link ou QR. As respostas regressam cifradas ao teu painel privado." }] },
  zh: { title: "Z4SK 快速导览", intro: "创建大胆的问题，私密分享，让答案回到你身边。", skip: "跳过", next: "下一步", start: "开始创建", close: "关闭导览", noMore: "不再显示", steps: [{ eyebrow: "01 · 创建", title: "从两个名字开始", copy: "填写你的名字、对方的名字，并选择合适的大胆程度。" }, { eyebrow: "02 · 定制", title: "做成你的风格", copy: "选择问题、添加自己的问题、设置期限并预览邀请风格。" }, { eyebrow: "03 · 保护", title: "添加第二个秘密", copy: "使用可重复的 Duo 密钥，或直接使用完整链接。" }, { eyebrow: "04 · 分享", title: "发送一个小秘密", copy: "分享链接或二维码。答案会加密返回你的私人面板。" }] },
  hi: { title: "Z4SK का छोटा टूर", intro: "कुछ बेबाक बनाएँ, निजी तौर पर साझा करें और जवाब अपने पास वापस पाएँ।", skip: "छोड़ें", next: "आगे", start: "बनाना शुरू करें", close: "टूर बंद करें", noMore: "फिर न दिखाएँ", steps: [{ eyebrow: "01 · बनाएँ", title: "दो नामों से शुरू करें", copy: "अपना नाम, दूसरे व्यक्ति का नाम और सही तीव्रता चुनकर माहौल तय करें।" }, { eyebrow: "02 · सजाएँ", title: "इसे अपना बनाएँ", copy: "सवाल चुनें, अपने सवाल जोड़ें, समय-सीमा तय करें और शैली का प्रीव्यू देखें।" }, { eyebrow: "03 · सुरक्षित करें", title: "दूसरा रहस्य जोड़ें", copy: "दोबारा इस्तेमाल होने वाली Duo कुंजी या पूरा लिंक चुनें।" }, { eyebrow: "04 · साझा करें", title: "एक छोटा रहस्य भेजें", copy: "लिंक या QR साझा करें। जवाब एन्क्रिप्ट होकर आपके निजी पैनल में लौटेंगे।" }] },
  ja: { title: "Z4SK クイックツアー", intro: "少し大胆なものを作って、非公開で送り、答えを受け取りましょう。", skip: "スキップ", next: "次へ", start: "作成を始める", close: "ツアーを閉じる", noMore: "次回から表示しない", steps: [{ eyebrow: "01 · 作成", title: "2人の名前から開始", copy: "自分と相手の名前、ちょうどいい大胆さを選んで雰囲気を決めます。" }, { eyebrow: "02 · カスタム", title: "自分らしく整える", copy: "質問を選び、自作の質問、期限、招待スタイルを設定します。" }, { eyebrow: "03 · 保護", title: "2つ目の秘密を追加", copy: "再利用できるDuoキー、または完全なリンクを使います。" }, { eyebrow: "04 · 共有", title: "小さな秘密を送る", copy: "リンクかQRを共有。答えは暗号化されて非公開パネルに戻ります。" }] },
  tr: { title: "Kısa bir Z4SK turu", intro: "Cesur bir şey oluştur, özel olarak paylaş ve yanıtların sana dönmesini bekle.", skip: "Atla", next: "İleri", start: "Oluşturmaya başla", close: "Turu kapat", noMore: "Bir daha gösterme", steps: [{ eyebrow: "01 · OLUŞTUR", title: "İki adla başla", copy: "Adın, diğer kişinin adı ve uygun bir yoğunlukla havayı belirle." }, { eyebrow: "02 · ŞEKİLLENDİR", title: "Kendine göre yap", copy: "Soruları seç, kendi sorularını ekle, süreyi belirle ve stili önizle." }, { eyebrow: "03 · KORU", title: "İkinci bir sır ekle", copy: "Yeniden kullanılabilir Duo anahtarını veya tam bağlantıyı kullan." }, { eyebrow: "04 · PAYLAŞ", title: "Küçük bir sır gönder", copy: "Bağlantıyı veya QR'ı paylaş. Yanıtlar şifreli olarak özel paneline döner." }] },
  machine: { title: "Z4SK_TOUR", intro: "CREATE daring_questions; SHARE private; RECEIVE encrypted_answers", skip: "SKIP", next: "NEXT", start: "CREATE", close: "CLOSE_TOUR", noMore: "tour.seen=true", steps: [{ eyebrow: "01 · CREATE", title: "IDENTITY", copy: "SET creator_name + recipient_name + intensity" }, { eyebrow: "02 · CONFIGURE", title: "CUSTOMIZE", copy: "SELECT questions + expiry + visual_style" }, { eyebrow: "03 · PROTECT", title: "SECOND_SECRET", copy: "USE reusable_duo_key OR complete_link" }, { eyebrow: "04 · SHARE", title: "DELIVER", copy: "SEND link|QR; RECEIVE encrypted responses" }] },
};

const backCopy: Partial<Record<Locale, string>> = {
  it: "Indietro",
  fr: "Retour",
  de: "Zurück",
  nl: "Terug",
  eo: "Reen",
  pt: "Voltar",
  zh: "返回",
  hi: "वापस",
  ja: "戻る",
  tr: "Geri",
  machine: "BACK",
};

export function Tour({ openRequest = 0, locale: pageLocale }: { openRequest?: number; locale?: Locale }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [noMore, setNoMore] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(TOUR_SEEN_KEY) === "1"; } catch { return false; }
  });
  const [languageBarOpen, setLanguageBarOpen] = useState(true);
  const [languageBarClosing, setLanguageBarClosing] = useState(false);
  const { locale: contextLocale, setLocale } = useLanguage();
  const locale = pageLocale ?? contextLocale;
  const c = copy[locale];

  useEffect(() => {
    const seen = window.localStorage.getItem(TOUR_SEEN_KEY) === "1";
    if (!seen) queueMicrotask(() => setOpen(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const preloadInOrder = async () => {
      for (const src of TOUR_IMAGES) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          const image = new window.Image();
          image.decoding = "async";
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = src;
        });
      }
    };
    void preloadInOrder();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (openRequest > 0) {
      const frame = window.requestAnimationFrame(() => {
        setStep(0);
        setOpen(true);
        setNoMore(window.localStorage.getItem(TOUR_SEEN_KEY) === "1");
        setLanguageBarClosing(false);
        setLanguageBarOpen(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [openRequest]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function close() {
    if (noMore) window.localStorage.setItem(TOUR_SEEN_KEY, "1");
    else window.localStorage.removeItem(TOUR_SEEN_KEY);
    setOpen(false);
  }

  function finish() {
    close();
  }

  function chooseLanguage(nextLocale: Locale) {
    setLocale(nextLocale);
    setLanguageBarClosing(true);
  }

  function goToStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(c.steps.length - 1, nextStep));
    setStep(boundedStep);
    setLanguageBarClosing(boundedStep !== 0);
  }

  if (!open) return null;
  const current = c.steps[step];
  const last = step === c.steps.length - 1;
  const back = c.back ?? backCopy[locale] ?? "Back";
  return (
    <div className="tour-backdrop" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-stage">
        {step === 0 && <div className="tour-language-reveal">
          {languageBarOpen && <div className={`tour-language-bar${languageBarClosing ? " is-closing" : ""}`} aria-label="Language selector">
            {LOCALES.map((item) => <button key={item.id} type="button" className={item.id === locale ? "active" : ""} onClick={() => chooseLanguage(item.id)} aria-pressed={item.id === locale} title={item.label}>{item.short}</button>)}
          </div>}
        </div>}
        <section className="tour-dialog">
        <button className="tour-close" type="button" onClick={close} aria-label={c.close}>×</button>
        <div className="tour-grid">
          <div className="tour-copy">
            <span className="tour-kicker">Z4SK · {current.eyebrow}</span>
            <h2 id="tour-title">{current.title}</h2>
            <p className="tour-intro">{current.copy}</p>
            <div className="tour-progress" aria-label={`${step + 1} / ${c.steps.length}`}>
              {c.steps.map((item, index) => <button key={item.eyebrow} type="button" className={index === step ? "active" : ""} onClick={() => goToStep(index)} aria-label={item.eyebrow} aria-current={index === step ? "step" : undefined} />)}
            </div>
          </div>
          <div className="tour-art-wrap">
            <Image key={TOUR_IMAGES[step]} src={TOUR_IMAGES[step]} alt="Dos personas adultas compartiendo preguntas atrevidas por el móvil" className="tour-art" fill sizes="(max-width: 700px) 100vw, 50vw" priority />
            <span className="tour-art-note">{step === 0 ? "ASK · ANSWER · DARE" : current.eyebrow}</span>
          </div>
        </div>
        <div className="tour-footer">
          <label className="tour-no-more"><input type="checkbox" checked={noMore} onChange={(event) => setNoMore(event.target.checked)} /> <span>{c.noMore}</span></label>
          <div className="tour-actions">
            <button className="tour-back" type="button" onClick={() => goToStep(step - 1)} disabled={step === 0}>{back}</button>
            <button className="tour-skip" type="button" onClick={close}>{c.skip}</button>
            {last ? <button className="tour-primary" type="button" onClick={finish}>{c.start} <span>→</span></button> : <button className="tour-primary" type="button" onClick={() => goToStep(step + 1)}>{c.next} <span>→</span></button>}
          </div>
        </div>
        </section>
      </div>
    </div>
  );
}
