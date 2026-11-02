import type { Locale } from "./i18n";

export type SharedKeyCopy = {
  protectTitle: string;
  protectBody: string;
  generate: string;
  existing: string;
  ready: string;
  replace: string;
  confirm: string;
  cardTitle: string;
  cardBody: string;
  fingerprint: string;
  phrase: string;
  phraseHelp: string;
  copyWords: string;
  copied: string;
  download: string;
  unlockTitle: string;
  unlockBody: string;
  scan: string;
  stop: string;
  upload: string;
  words: string;
  unlock: string;
  invalid: string;
  camera: string;
  working: string;
  differentChannel: string;
};

export const SHARED_KEY_COPY: Record<Locale, SharedKeyCopy> = {
  en: {
    protectTitle: "Shared key · required",
    protectBody:
      "The link and this reusable key are two separate secrets. Create one for this person or scan the QR you already share.",
    generate: "Create a new shared key",
    existing: "Use an existing QR",
    ready: "Shared key ready",
    replace: "Use another key",
    confirm:
      "I saved my copy and will send the other copy through a different channel.",
    cardTitle: "Reusable shared key",
    cardBody:
      "Keep one copy and give the other to this person. Z4SK never uploads or stores it.",
    fingerprint: "FINGERPRINT",
    phrase: "24-WORD RECOVERY",
    phraseHelp:
      "These words are the same key as the QR. Keep them private; they are not an extra factor.",
    copyWords: "Copy recovery words",
    copied: "Copied",
    download: "Download fixed QR",
    unlockTitle: "Shared key required",
    unlockBody:
      "The link alone cannot open this invitation. Scan the shared-key QR received through the other channel.",
    scan: "Scan QR with camera",
    stop: "Stop camera",
    upload: "Read QR image",
    words: "Or enter the 24 recovery words",
    unlock: "Unlock locally",
    invalid: "That QR or recovery phrase is not a valid Z4SK shared key.",
    camera:
      "Camera access failed. You can upload the QR image or enter the words.",
    working: "Checking locally…",
    differentChannel:
      "Do not send this key together with the invitation link. Anyone who obtains both can decrypt the invitation.",
  },
  es: {
    protectTitle: "Llave compartida · obligatoria",
    protectBody:
      "El enlace y esta llave reutilizable son dos secretos separados. Crea una para esta persona o escanea el QR que ya compartís.",
    generate: "Crear una llave nueva",
    existing: "Usar un QR existente",
    ready: "Llave compartida preparada",
    replace: "Usar otra llave",
    confirm: "He guardado mi copia y entregaré la otra por un canal diferente.",
    cardTitle: "Llave compartida reutilizable",
    cardBody:
      "Conserva una copia y entrega la otra a esta persona. Z4SK nunca la sube ni la almacena.",
    fingerprint: "HUELLA",
    phrase: "RECUPERACIÓN DE 24 PALABRAS",
    phraseHelp:
      "Estas palabras representan la misma llave que el QR. Mantenlas en secreto; no son un factor adicional.",
    copyWords: "Copiar palabras",
    copied: "Copiadas",
    download: "Descargar QR fijo",
    unlockTitle: "Hace falta la llave compartida",
    unlockBody:
      "El enlace por sí solo no puede abrir esta invitación. Escanea el QR recibido por el otro canal.",
    scan: "Escanear QR con la cámara",
    stop: "Detener cámara",
    upload: "Leer imagen del QR",
    words: "O introduce las 24 palabras",
    unlock: "Desbloquear localmente",
    invalid: "Ese QR o frase de recuperación no es una llave Z4SK válida.",
    camera:
      "No se pudo usar la cámara. Puedes subir la imagen del QR o introducir las palabras.",
    working: "Comprobando localmente…",
    differentChannel:
      "No envíes esta llave junto al enlace. Quien consiga ambos podrá descifrar la invitación.",
  },
  it: {
    protectTitle: "Chiave condivisa · obbligatoria",
    protectBody:
      "Il link e questa chiave riutilizzabile sono due segreti separati.",
    generate: "Crea una nuova chiave",
    existing: "Usa un QR esistente",
    ready: "Chiave pronta",
    replace: "Usa un'altra chiave",
    confirm: "Ho salvato la mia copia e invierò l'altra su un canale diverso.",
    cardTitle: "Chiave condivisa riutilizzabile",
    cardBody:
      "Conserva una copia e consegna l'altra. Z4SK non la carica né la salva.",
    fingerprint: "IMPRONTA",
    phrase: "RECUPERO DI 24 PAROLE",
    phraseHelp:
      "Le parole rappresentano la stessa chiave del QR e non sono un fattore aggiuntivo.",
    copyWords: "Copia le parole",
    copied: "Copiate",
    download: "Scarica QR fisso",
    unlockTitle: "Serve la chiave condivisa",
    unlockBody:
      "Il link da solo non apre l'invito. Scansiona il QR ricevuto separatamente.",
    scan: "Scansiona con la fotocamera",
    stop: "Ferma fotocamera",
    upload: "Leggi immagine QR",
    words: "Oppure inserisci le 24 parole",
    unlock: "Sblocca localmente",
    invalid: "QR o frase Z4SK non validi.",
    camera:
      "Fotocamera non disponibile. Carica l'immagine o inserisci le parole.",
    working: "Verifica locale…",
    differentChannel:
      "Non inviare la chiave insieme al link. Chi possiede entrambi può decifrare l'invito.",
  },
  fr: {
    protectTitle: "Clé partagée · obligatoire",
    protectBody:
      "Le lien et cette clé réutilisable sont deux secrets distincts.",
    generate: "Créer une nouvelle clé",
    existing: "Utiliser un QR existant",
    ready: "Clé prête",
    replace: "Utiliser une autre clé",
    confirm:
      "J'ai conservé ma copie et transmettrai l'autre par un canal différent.",
    cardTitle: "Clé partagée réutilisable",
    cardBody:
      "Gardez une copie et remettez l'autre. Z4SK ne la téléverse ni ne la stocke.",
    fingerprint: "EMPREINTE",
    phrase: "RÉCUPÉRATION EN 24 MOTS",
    phraseHelp:
      "Les mots représentent la même clé que le QR, pas un facteur supplémentaire.",
    copyWords: "Copier les mots",
    copied: "Copiés",
    download: "Télécharger le QR fixe",
    unlockTitle: "Clé partagée requise",
    unlockBody:
      "Le lien seul ne peut pas ouvrir l'invitation. Scannez le QR reçu séparément.",
    scan: "Scanner avec la caméra",
    stop: "Arrêter la caméra",
    upload: "Lire une image QR",
    words: "Ou saisir les 24 mots",
    unlock: "Déverrouiller localement",
    invalid: "QR ou phrase Z4SK non valide.",
    camera: "Caméra indisponible. Importez l'image ou saisissez les mots.",
    working: "Vérification locale…",
    differentChannel:
      "N'envoyez pas cette clé avec le lien. Quiconque possède les deux peut déchiffrer l'invitation.",
  },
  de: {
    protectTitle: "Geteilter Schlüssel · erforderlich",
    protectBody:
      "Link und wiederverwendbarer Schlüssel sind zwei getrennte Geheimnisse.",
    generate: "Neuen Schlüssel erstellen",
    existing: "Vorhandenen QR verwenden",
    ready: "Schlüssel bereit",
    replace: "Anderen Schlüssel verwenden",
    confirm:
      "Ich habe meine Kopie gespeichert und übermittle die andere getrennt.",
    cardTitle: "Wiederverwendbarer Schlüssel",
    cardBody:
      "Eine Kopie behalten, die andere übergeben. Z4SK lädt ihn nie hoch.",
    fingerprint: "FINGERABDRUCK",
    phrase: "24-WORT-WIEDERHERSTELLUNG",
    phraseHelp:
      "Wörter und QR sind derselbe Schlüssel, kein zusätzlicher Faktor.",
    copyWords: "Wörter kopieren",
    copied: "Kopiert",
    download: "Festen QR laden",
    unlockTitle: "Geteilter Schlüssel erforderlich",
    unlockBody:
      "Der Link allein öffnet die Einladung nicht. Scanne den separat erhaltenen QR.",
    scan: "QR mit Kamera scannen",
    stop: "Kamera stoppen",
    upload: "QR-Bild lesen",
    words: "Oder 24 Wörter eingeben",
    unlock: "Lokal entsperren",
    invalid: "Ungültiger Z4SK-QR oder Wiederherstellungssatz.",
    camera:
      "Kamera nicht verfügbar. Lade das Bild hoch oder gib die Wörter ein.",
    working: "Lokale Prüfung…",
    differentChannel:
      "Schlüssel und Link nie zusammen senden. Wer beide besitzt, kann entschlüsseln.",
  },
  nl: {
    protectTitle: "Gedeelde sleutel · verplicht",
    protectBody: "De link en herbruikbare sleutel zijn twee aparte geheimen.",
    generate: "Nieuwe sleutel maken",
    existing: "Bestaande QR gebruiken",
    ready: "Sleutel gereed",
    replace: "Andere sleutel gebruiken",
    confirm:
      "Ik heb mijn kopie bewaard en geef de andere via een ander kanaal.",
    cardTitle: "Herbruikbare gedeelde sleutel",
    cardBody:
      "Bewaar één kopie en geef de andere. Z4SK uploadt of bewaart hem nooit.",
    fingerprint: "VINGERAFDRUK",
    phrase: "HERSTEL MET 24 WOORDEN",
    phraseHelp: "De woorden en QR zijn dezelfde sleutel, geen extra factor.",
    copyWords: "Woorden kopiëren",
    copied: "Gekopieerd",
    download: "Vaste QR downloaden",
    unlockTitle: "Gedeelde sleutel vereist",
    unlockBody:
      "De link alleen opent de uitnodiging niet. Scan de apart ontvangen QR.",
    scan: "Scan QR met camera",
    stop: "Camera stoppen",
    upload: "QR-afbeelding lezen",
    words: "Of voer de 24 woorden in",
    unlock: "Lokaal ontgrendelen",
    invalid: "Ongeldige Z4SK-QR of herstelzin.",
    camera:
      "Camera niet beschikbaar. Upload de afbeelding of voer de woorden in.",
    working: "Lokaal controleren…",
    differentChannel:
      "Stuur sleutel en link niet samen. Wie beide heeft kan de uitnodiging ontsleutelen.",
  },
  eo: {
    protectTitle: "Komuna ŝlosilo · deviga",
    protectBody: "La ligilo kaj reuzebla ŝlosilo estas du apartaj sekretoj.",
    generate: "Krei novan ŝlosilon",
    existing: "Uzi ekzistantan QR",
    ready: "Ŝlosilo preta",
    replace: "Uzi alian ŝlosilon",
    confirm: "Mi konservis mian kopion kaj transdonos la alian aparte.",
    cardTitle: "Reuzebla komuna ŝlosilo",
    cardBody: "Konservu unu kopion kaj donu la alian. Z4SK neniam alŝutas ĝin.",
    fingerprint: "FINGROSPURO",
    phrase: "24-VORTA REAKIRO",
    phraseHelp: "La vortoj kaj QR estas la sama ŝlosilo, ne plia faktoro.",
    copyWords: "Kopii vortojn",
    copied: "Kopiite",
    download: "Elŝuti fiksan QR",
    unlockTitle: "Komuna ŝlosilo bezonata",
    unlockBody:
      "La ligilo sola ne malfermas la inviton. Skanu la aparte ricevitan QR.",
    scan: "Skani QR per fotilo",
    stop: "Halti fotilon",
    upload: "Legi QR-bildon",
    words: "Aŭ enigu la 24 vortojn",
    unlock: "Malŝlosi loke",
    invalid: "Nevalida Z4SK-QR aŭ reakiro.",
    camera: "Fotilo ne disponeblas. Alŝutu la bildon aŭ enigu la vortojn.",
    working: "Loka kontrolo…",
    differentChannel:
      "Ne sendu la ŝlosilon kun la ligilo. Kiu havas ambaŭ povas deĉifri.",
  },
  pt: {
    protectTitle: "Chave partilhada · obrigatória",
    protectBody:
      "O link e esta chave reutilizável são dois segredos separados.",
    generate: "Criar nova chave",
    existing: "Usar QR existente",
    ready: "Chave pronta",
    replace: "Usar outra chave",
    confirm:
      "Guardei a minha cópia e entregarei a outra por um canal diferente.",
    cardTitle: "Chave partilhada reutilizável",
    cardBody:
      "Guarda uma cópia e entrega a outra. O Z4SK nunca a envia nem armazena.",
    fingerprint: "IMPRESSÃO",
    phrase: "RECUPERAÇÃO DE 24 PALAVRAS",
    phraseHelp: "As palavras são a mesma chave do QR, não outro fator.",
    copyWords: "Copiar palavras",
    copied: "Copiadas",
    download: "Descarregar QR fixo",
    unlockTitle: "Chave partilhada necessária",
    unlockBody:
      "O link sozinho não abre o convite. Lê o QR recebido separadamente.",
    scan: "Ler QR com a câmara",
    stop: "Parar câmara",
    upload: "Ler imagem QR",
    words: "Ou introduz as 24 palavras",
    unlock: "Desbloquear localmente",
    invalid: "QR ou frase Z4SK inválidos.",
    camera: "Câmara indisponível. Carrega a imagem ou introduz as palavras.",
    working: "A verificar localmente…",
    differentChannel:
      "Não envies a chave junto com o link. Quem tiver ambos pode decifrar o convite.",
  },
  zh: {
    protectTitle: "共享密钥 · 必需",
    protectBody: "链接和可重复使用的密钥是两个独立秘密。",
    generate: "创建新密钥",
    existing: "使用现有二维码",
    ready: "密钥已就绪",
    replace: "使用其他密钥",
    confirm: "我已保存自己的副本，并会通过另一渠道交付另一份。",
    cardTitle: "可重复使用的共享密钥",
    cardBody: "保留一份并交付另一份。Z4SK 不会上传或存储它。",
    fingerprint: "指纹",
    phrase: "24 词恢复短语",
    phraseHelp: "词语与二维码代表同一密钥，并非额外因素。",
    copyWords: "复制恢复词",
    copied: "已复制",
    download: "下载固定二维码",
    unlockTitle: "需要共享密钥",
    unlockBody: "仅凭链接无法打开邀请。请扫描另行收到的二维码。",
    scan: "用相机扫描",
    stop: "停止相机",
    upload: "读取二维码图片",
    words: "或输入 24 个恢复词",
    unlock: "在本地解锁",
    invalid: "无效的 Z4SK 二维码或恢复短语。",
    camera: "无法使用相机。请上传图片或输入恢复词。",
    working: "正在本地检查…",
    differentChannel:
      "不要将密钥与链接一起发送。同时获得两者的人可以解密邀请。",
  },
  hi: {
    protectTitle: "साझा कुंजी · आवश्यक",
    protectBody: "लिंक और दोबारा उपयोग होने वाली कुंजी दो अलग रहस्य हैं।",
    generate: "नई कुंजी बनाएँ",
    existing: "मौजूदा QR उपयोग करें",
    ready: "कुंजी तैयार",
    replace: "दूसरी कुंजी उपयोग करें",
    confirm:
      "मैंने अपनी प्रति सुरक्षित की है और दूसरी अलग माध्यम से दूँगा/दूँगी।",
    cardTitle: "दोबारा उपयोग होने वाली साझा कुंजी",
    cardBody:
      "एक प्रति रखें और दूसरी दें। Z4SK इसे अपलोड या संग्रहित नहीं करता।",
    fingerprint: "फिंगरप्रिंट",
    phrase: "24 शब्दों से रिकवरी",
    phraseHelp: "शब्द और QR एक ही कुंजी हैं, अतिरिक्त कारक नहीं।",
    copyWords: "शब्द कॉपी करें",
    copied: "कॉपी हुआ",
    download: "स्थिर QR डाउनलोड करें",
    unlockTitle: "साझा कुंजी आवश्यक",
    unlockBody: "केवल लिंक से निमंत्रण नहीं खुलेगा। अलग से मिला QR स्कैन करें।",
    scan: "कैमरे से QR स्कैन करें",
    stop: "कैमरा रोकें",
    upload: "QR चित्र पढ़ें",
    words: "या 24 शब्द लिखें",
    unlock: "डिवाइस पर खोलें",
    invalid: "यह मान्य Z4SK QR या रिकवरी वाक्य नहीं है।",
    camera: "कैमरा उपलब्ध नहीं। चित्र अपलोड करें या शब्द लिखें।",
    working: "डिवाइस पर जाँच…",
    differentChannel:
      "कुंजी और लिंक साथ न भेजें। दोनों पाने वाला निमंत्रण खोल सकता है।",
  },
  ja: {
    protectTitle: "共有鍵・必須",
    protectBody: "リンクと再利用できる鍵は別々の秘密です。",
    generate: "新しい鍵を作成",
    existing: "既存のQRを使用",
    ready: "鍵の準備完了",
    replace: "別の鍵を使う",
    confirm: "自分のコピーを保存し、もう一方を別経路で渡します。",
    cardTitle: "再利用可能な共有鍵",
    cardBody: "1部を保管し、もう1部を渡してください。Z4SKは保存しません。",
    fingerprint: "指紋",
    phrase: "24語の復元フレーズ",
    phraseHelp: "単語とQRは同じ鍵で、追加要素ではありません。",
    copyWords: "復元語をコピー",
    copied: "コピー済み",
    download: "固定QRを保存",
    unlockTitle: "共有鍵が必要です",
    unlockBody:
      "リンクだけでは開けません。別経路で受け取ったQRを読み取ってください。",
    scan: "カメラでQRを読む",
    stop: "カメラを停止",
    upload: "QR画像を読む",
    words: "または24語を入力",
    unlock: "端末内で解除",
    invalid: "有効なZ4SKのQRまたは復元語ではありません。",
    camera: "カメラを利用できません。画像または単語を使用してください。",
    working: "端末内で確認中…",
    differentChannel:
      "鍵とリンクを一緒に送らないでください。両方を持つ人は復号できます。",
  },
  tr: {
    protectTitle: "Paylaşılan anahtar · zorunlu",
    protectBody: "Bağlantı ve yeniden kullanılabilir anahtar iki ayrı sırdır.",
    generate: "Yeni anahtar oluştur",
    existing: "Mevcut QR kullan",
    ready: "Anahtar hazır",
    replace: "Başka anahtar kullan",
    confirm: "Kopyamı sakladım; diğerini farklı kanaldan ileteceğim.",
    cardTitle: "Yeniden kullanılabilir anahtar",
    cardBody:
      "Bir kopyayı sakla, diğerini ver. Z4SK anahtarı yüklemez veya saklamaz.",
    fingerprint: "PARMAK İZİ",
    phrase: "24 KELİMELİK KURTARMA",
    phraseHelp: "Kelimeler QR ile aynı anahtardır; ek faktör değildir.",
    copyWords: "Kelimeleri kopyala",
    copied: "Kopyalandı",
    download: "Sabit QR indir",
    unlockTitle: "Paylaşılan anahtar gerekli",
    unlockBody: "Bağlantı tek başına daveti açmaz. Ayrı alınan QR'ı tara.",
    scan: "Kamerayla QR tara",
    stop: "Kamerayı durdur",
    upload: "QR görselini oku",
    words: "Veya 24 kelimeyi gir",
    unlock: "Yerel olarak aç",
    invalid: "Geçersiz Z4SK QR veya kurtarma ifadesi.",
    camera: "Kamera kullanılamadı. Görsel yükle veya kelimeleri gir.",
    working: "Yerel kontrol…",
    differentChannel:
      "Anahtarı bağlantıyla birlikte gönderme. İkisini alan daveti çözebilir.",
  },
  machine: {
    protectTitle: "SHARED_KEY::REQUIRED",
    protectBody: "link_secret != shared_key; channels=2",
    generate: "GENERATE key",
    existing: "IMPORT QR",
    ready: "KEY_READY",
    replace: "REPLACE_KEY",
    confirm: "ACK saved_copy=true AND channel_separation=true",
    cardTitle: "REUSABLE_SHARED_KEY",
    cardBody: "server.receive=false; persistence=false",
    fingerprint: "FINGERPRINT",
    phrase: "RECOVERY_WORDS[24]",
    phraseHelp: "mnemonic==qr_key; additional_factor=false",
    copyWords: "COPY words",
    copied: "COPIED",
    download: "DOWNLOAD fixed_qr",
    unlockTitle: "SHARED_KEY_REQUIRED",
    unlockBody: "link_only.decrypt=false; SCAN second_channel_qr",
    scan: "SCAN camera",
    stop: "STOP camera",
    upload: "DECODE qr_image",
    words: "OR INPUT words[24]",
    unlock: "LOCAL_UNLOCK",
    invalid: "ERR_SHARED_KEY_INVALID",
    camera: "ERR_CAMERA; USE file OR words",
    working: "LOCAL_VERIFY…",
    differentChannel:
      "MUST_NOT_SEND key WITH link; holder(link,key).decrypt=true",
  },
};
