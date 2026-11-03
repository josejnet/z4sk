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
    protectTitle: "Extra shared key · optional",
    protectBody:
      "For extra protection, require a second secret sent separately. Without it, the complete link opens the invitation.",
    generate: "Create a new shared key",
    existing: "Use an existing QR",
    ready: "Shared key ready",
    replace: "Use another key",
    confirm:
      "I saved my copy and will send the other copy through a different channel.",
    cardTitle: "Reusable shared key",
    cardBody:
      "Save the branded QR. On the same phone, choose it later from Photos or paste the recovery phrase. The ID only identifies the key; it cannot open it.",
    fingerprint: "KEY ID · NOT A SECRET",
    phrase: "RECOVERY PHRASE",
    phraseHelp:
      "This secure 12-word phrase is the same key as the QR. Keep it private; it is not an extra factor.",
    copyWords: "Copy recovery phrase",
    copied: "Copied",
    download: "Download fixed QR",
    unlockTitle: "Shared key required",
    unlockBody:
      "The link alone cannot open this invitation. Scan the shared-key QR received through the other channel.",
    scan: "Scan QR with camera",
    stop: "Stop camera",
    upload: "Choose QR from Photos",
    words: "Or paste the recovery phrase (12 words; old 24-word phrases also work)",
    unlock: "Unlock locally",
    invalid: "That QR or recovery phrase is not a valid Z4SK shared key.",
    camera:
      "Camera access failed. You can upload the QR image or enter the words.",
    working: "Checking locally…",
    differentChannel:
      "This is the key QR, not the invitation QR. Send it separately from the invitation link or QR. Anyone who obtains both can decrypt the invitation.",
  },
  es: {
    protectTitle: "Llave extra · opcional",
    protectBody:
      "Si quieres más protección, exige un segundo secreto enviado aparte. Sin llave, el enlace completo abre la invitación.",
    generate: "Crear una llave nueva",
    existing: "Usar un QR existente",
    ready: "Llave compartida preparada",
    replace: "Usar otra llave",
    confirm: "He guardado mi copia y entregaré la otra por un canal diferente.",
    cardTitle: "Llave compartida reutilizable",
    cardBody:
      "Guarda el QR con marca Z4SK. En el mismo móvil podrás elegirlo desde Fotos o pegar la frase de recuperación. El identificador solo reconoce la llave; no la abre.",
    fingerprint: "ID DE LLAVE · NO ES SECRETO",
    phrase: "FRASE DE RECUPERACIÓN",
    phraseHelp:
      "Esta frase segura de 12 palabras representa la misma llave que el QR. Mantenla en secreto; no es un factor adicional.",
    copyWords: "Copiar frase de recuperación",
    copied: "Frase copiada",
    download: "Descargar QR fijo",
    unlockTitle: "Hace falta la llave compartida",
    unlockBody:
      "El enlace por sí solo no puede abrir esta invitación. Escanea el QR recibido por el otro canal.",
    scan: "Escanear QR con la cámara",
    stop: "Detener cámara",
    upload: "Elegir QR desde Fotos",
    words: "O pega la frase de recuperación (12 palabras; también admite frases antiguas de 24)",
    unlock: "Desbloquear localmente",
    invalid: "Ese QR o frase de recuperación no es una llave Z4SK válida.",
    camera:
      "No se pudo usar la cámara. Puedes subir la imagen del QR o introducir las palabras.",
    working: "Comprobando localmente…",
    differentChannel:
      "Este es el QR de la llave, no el QR de invitación. Envíalo separado del enlace o QR de invitación. Quien consiga ambos podrá descifrarla.",
  },
  it: {
    protectTitle: "Chiave extra · facoltativa",
    protectBody:
      "Per una protezione extra, richiedi un secondo segreto inviato separatamente. Senza chiave, il link completo apre l'invito.",
    generate: "Crea una nuova chiave",
    existing: "Usa un QR esistente",
    ready: "Chiave pronta",
    replace: "Usa un'altra chiave",
    confirm: "Ho salvato la mia copia e invierò l'altra su un canale diverso.",
    cardTitle: "Chiave condivisa riutilizzabile",
    cardBody:
      "Salva il QR Z4SK. Sullo stesso telefono potrai sceglierlo da Foto o incollare la frase di recupero. L'ID identifica soltanto la chiave.",
    fingerprint: "ID CHIAVE · NON SEGRETO",
    phrase: "FRASE DI RECUPERO",
    phraseHelp:
      "Le parole rappresentano la stessa chiave del QR e non sono un fattore aggiuntivo.",
    copyWords: "Copia la frase di recupero",
    copied: "Copiate",
    download: "Scarica QR fisso",
    unlockTitle: "Serve la chiave condivisa",
    unlockBody:
      "Il link da solo non apre l'invito. Scansiona il QR ricevuto separatamente.",
    scan: "Scansiona con la fotocamera",
    stop: "Ferma fotocamera",
    upload: "Scegli QR da Foto",
    words: "Oppure incolla le 12 parole (anche 24 per chiavi precedenti)",
    unlock: "Sblocca localmente",
    invalid: "QR o frase Z4SK non validi.",
    camera:
      "Fotocamera non disponibile. Carica l'immagine o inserisci le parole.",
    working: "Verifica locale…",
    differentChannel:
      "Questo è il QR della chiave, non il QR dell'invito. Invialo separatamente dal link o QR dell'invito. Chi possiede entrambi può decifrarlo.",
  },
  fr: {
    protectTitle: "Clé supplémentaire · facultative",
    protectBody:
      "Pour une protection renforcée, exigez un second secret transmis séparément. Sans clé, le lien complet ouvre l'invitation.",
    generate: "Créer une nouvelle clé",
    existing: "Utiliser un QR existant",
    ready: "Clé prête",
    replace: "Utiliser une autre clé",
    confirm:
      "J'ai conservé ma copie et transmettrai l'autre par un canal différent.",
    cardTitle: "Clé partagée réutilisable",
    cardBody:
      "Enregistrez le QR Z4SK. Sur le même téléphone, choisissez-le dans Photos ou collez la phrase de récupération. L'identifiant ne fait qu'identifier la clé.",
    fingerprint: "ID DE CLÉ · NON SECRET",
    phrase: "PHRASE DE RÉCUPÉRATION",
    phraseHelp:
      "Les mots représentent la même clé que le QR, pas un facteur supplémentaire.",
    copyWords: "Copier la phrase de récupération",
    copied: "Copiés",
    download: "Télécharger le QR fixe",
    unlockTitle: "Clé partagée requise",
    unlockBody:
      "Le lien seul ne peut pas ouvrir l'invitation. Scannez le QR reçu séparément.",
    scan: "Scanner avec la caméra",
    stop: "Arrêter la caméra",
    upload: "Choisir le QR dans Photos",
    words: "Ou coller les 12 mots (les anciennes clés de 24 restent valides)",
    unlock: "Déverrouiller localement",
    invalid: "QR ou phrase Z4SK non valide.",
    camera: "Caméra indisponible. Importez l'image ou saisissez les mots.",
    working: "Vérification locale…",
    differentChannel:
      "Ceci est le QR de la clé, pas celui de l'invitation. Envoyez-le séparément du lien ou QR d'invitation. Quiconque possède les deux peut la déchiffrer.",
  },
  de: {
    protectTitle: "Zusatzschlüssel · optional",
    protectBody:
      "Für zusätzlichen Schutz ist ein separat übermitteltes zweites Geheimnis nötig. Ohne Schlüssel öffnet der vollständige Link die Einladung.",
    generate: "Neuen Schlüssel erstellen",
    existing: "Vorhandenen QR verwenden",
    ready: "Schlüssel bereit",
    replace: "Anderen Schlüssel verwenden",
    confirm:
      "Ich habe meine Kopie gespeichert und übermittle die andere getrennt.",
    cardTitle: "Wiederverwendbarer Schlüssel",
    cardBody:
      "Speichere den Z4SK-QR. Auf demselben Handy kannst du ihn später aus Fotos wählen oder die Wiederherstellungsphrase einfügen. Die ID identifiziert den Schlüssel nur.",
    fingerprint: "SCHLÜSSEL-ID · NICHT GEHEIM",
    phrase: "WIEDERHERSTELLUNGSPHRASE",
    phraseHelp:
      "Wörter und QR sind derselbe Schlüssel, kein zusätzlicher Faktor.",
    copyWords: "Wiederherstellungsphrase kopieren",
    copied: "Kopiert",
    download: "Festen QR laden",
    unlockTitle: "Geteilter Schlüssel erforderlich",
    unlockBody:
      "Der Link allein öffnet die Einladung nicht. Scanne den separat erhaltenen QR.",
    scan: "QR mit Kamera scannen",
    stop: "Kamera stoppen",
    upload: "QR aus Fotos wählen",
    words: "Oder 12 Wörter einfügen (alte 24-Wort-Schlüssel funktionieren weiter)",
    unlock: "Lokal entsperren",
    invalid: "Ungültiger Z4SK-QR oder Wiederherstellungssatz.",
    camera:
      "Kamera nicht verfügbar. Lade das Bild hoch oder gib die Wörter ein.",
    working: "Lokale Prüfung…",
    differentChannel:
      "Dies ist der Schlüssel-QR, nicht der Einladungs-QR. Sende ihn getrennt vom Einladungslink oder -QR. Wer beides besitzt, kann entschlüsseln.",
  },
  nl: {
    protectTitle: "Extra sleutel · optioneel",
    protectBody:
      "Voor extra bescherming is een tweede, apart gedeeld geheim nodig. Zonder sleutel opent de volledige link de uitnodiging.",
    generate: "Nieuwe sleutel maken",
    existing: "Bestaande QR gebruiken",
    ready: "Sleutel gereed",
    replace: "Andere sleutel gebruiken",
    confirm:
      "Ik heb mijn kopie bewaard en geef de andere via een ander kanaal.",
    cardTitle: "Herbruikbare gedeelde sleutel",
    cardBody:
      "Bewaar de Z4SK-QR. Op dezelfde telefoon kies je hem later uit Foto's of plak je de herstelzin. De ID identificeert de sleutel alleen.",
    fingerprint: "SLEUTEL-ID · NIET GEHEIM",
    phrase: "HERSTELZIN",
    phraseHelp: "De woorden en QR zijn dezelfde sleutel, geen extra factor.",
    copyWords: "Herstelzin kopiëren",
    copied: "Gekopieerd",
    download: "Vaste QR downloaden",
    unlockTitle: "Gedeelde sleutel vereist",
    unlockBody:
      "De link alleen opent de uitnodiging niet. Scan de apart ontvangen QR.",
    scan: "Scan QR met camera",
    stop: "Camera stoppen",
    upload: "Kies QR uit Foto's",
    words: "Of plak de 12 woorden (oude sleutels met 24 werken ook)",
    unlock: "Lokaal ontgrendelen",
    invalid: "Ongeldige Z4SK-QR of herstelzin.",
    camera:
      "Camera niet beschikbaar. Upload de afbeelding of voer de woorden in.",
    working: "Lokaal controleren…",
    differentChannel:
      "Dit is de sleutel-QR, niet de uitnodigings-QR. Stuur hem apart van de uitnodigingslink of -QR. Wie beide heeft kan ontsleutelen.",
  },
  eo: {
    protectTitle: "Plia ŝlosilo · nedeviga",
    protectBody:
      "Por aldona protekto, postulu duan sekreton senditan aparte. Sen ŝlosilo, la kompleta ligilo malfermas la inviton.",
    generate: "Krei novan ŝlosilon",
    existing: "Uzi ekzistantan QR",
    ready: "Ŝlosilo preta",
    replace: "Uzi alian ŝlosilon",
    confirm: "Mi konservis mian kopion kaj transdonos la alian aparte.",
    cardTitle: "Reuzebla komuna ŝlosilo",
    cardBody:
      "Konservu la Z4SK-QR. En la sama telefono elektu ĝin poste el Fotoj aŭ algluu la reakiran frazon. La ID nur identigas la ŝlosilon.",
    fingerprint: "ŜLOSILA ID · NE SEKRETO",
    phrase: "REAKIRA FRAZO",
    phraseHelp: "La vortoj kaj QR estas la sama ŝlosilo, ne plia faktoro.",
    copyWords: "Kopii reakiran frazon",
    copied: "Kopiite",
    download: "Elŝuti fiksan QR",
    unlockTitle: "Komuna ŝlosilo bezonata",
    unlockBody:
      "La ligilo sola ne malfermas la inviton. Skanu la aparte ricevitan QR.",
    scan: "Skani QR per fotilo",
    stop: "Halti fotilon",
    upload: "Elekti QR el Fotoj",
    words: "Aŭ algluu la 12 vortojn (malnovaj 24-vortaj ŝlosiloj ankaŭ funkcias)",
    unlock: "Malŝlosi loke",
    invalid: "Nevalida Z4SK-QR aŭ reakiro.",
    camera: "Fotilo ne disponeblas. Alŝutu la bildon aŭ enigu la vortojn.",
    working: "Loka kontrolo…",
    differentChannel:
      "Ĉi tiu estas la ŝlosila QR, ne la invita QR. Sendu ĝin aparte de la invita ligilo aŭ QR. Kiu havas ambaŭ povas deĉifri.",
  },
  pt: {
    protectTitle: "Chave extra · opcional",
    protectBody:
      "Para proteção extra, exige um segundo segredo enviado separadamente. Sem chave, o link completo abre o convite.",
    generate: "Criar nova chave",
    existing: "Usar QR existente",
    ready: "Chave pronta",
    replace: "Usar outra chave",
    confirm:
      "Guardei a minha cópia e entregarei a outra por um canal diferente.",
    cardTitle: "Chave partilhada reutilizável",
    cardBody:
      "Guarda o QR Z4SK. No mesmo telemóvel, escolhe-o depois nas Fotos ou cola a frase de recuperação. O ID apenas identifica a chave.",
    fingerprint: "ID DA CHAVE · NÃO É SEGREDO",
    phrase: "FRASE DE RECUPERAÇÃO",
    phraseHelp: "As palavras são a mesma chave do QR, não outro fator.",
    copyWords: "Copiar frase de recuperação",
    copied: "Copiadas",
    download: "Descarregar QR fixo",
    unlockTitle: "Chave partilhada necessária",
    unlockBody:
      "O link sozinho não abre o convite. Lê o QR recebido separadamente.",
    scan: "Ler QR com a câmara",
    stop: "Parar câmara",
    upload: "Escolher QR nas Fotos",
    words: "Ou cola as 12 palavras (chaves antigas de 24 também funcionam)",
    unlock: "Desbloquear localmente",
    invalid: "QR ou frase Z4SK inválidos.",
    camera: "Câmara indisponível. Carrega a imagem ou introduz as palavras.",
    working: "A verificar localmente…",
    differentChannel:
      "Este é o QR da chave, não o QR do convite. Envia-o separado do link ou QR do convite. Quem tiver ambos pode decifrar.",
  },
  zh: {
    protectTitle: "额外密钥 · 可选",
    protectBody: "如需额外保护，可要求通过其他渠道发送第二个秘密。若不使用密钥，完整链接即可打开邀请。",
    generate: "创建新密钥",
    existing: "使用现有二维码",
    ready: "密钥已就绪",
    replace: "使用其他密钥",
    confirm: "我已保存自己的副本，并会通过另一渠道交付另一份。",
    cardTitle: "可重复使用的共享密钥",
    cardBody: "保存带 Z4SK 品牌的二维码。在同一手机上可稍后从照片中选择，或粘贴恢复短语。标识符只能识别密钥，不能打开它。",
    fingerprint: "密钥标识 · 不是秘密",
    phrase: "恢复短语",
    phraseHelp: "词语与二维码代表同一密钥，并非额外因素。",
    copyWords: "复制恢复短语",
    copied: "已复制",
    download: "下载固定二维码",
    unlockTitle: "需要共享密钥",
    unlockBody: "仅凭链接无法打开邀请。请扫描另行收到的二维码。",
    scan: "用相机扫描",
    stop: "停止相机",
    upload: "从照片中选择二维码",
    words: "或粘贴 12 个词（旧的 24 词密钥仍可使用）",
    unlock: "在本地解锁",
    invalid: "无效的 Z4SK 二维码或恢复短语。",
    camera: "无法使用相机。请上传图片或输入恢复词。",
    working: "正在本地检查…",
    differentChannel:
      "这是密钥二维码，不是邀请二维码。请与邀请链接或二维码分开发送。同时获得两者的人可以解密邀请。",
  },
  hi: {
    protectTitle: "अतिरिक्त कुंजी · वैकल्पिक",
    protectBody: "अतिरिक्त सुरक्षा के लिए अलग माध्यम से भेजा गया दूसरा रहस्य रखें। कुंजी के बिना पूरा लिंक निमंत्रण खोलता है।",
    generate: "नई कुंजी बनाएँ",
    existing: "मौजूदा QR उपयोग करें",
    ready: "कुंजी तैयार",
    replace: "दूसरी कुंजी उपयोग करें",
    confirm:
      "मैंने अपनी प्रति सुरक्षित की है और दूसरी अलग माध्यम से दूँगा/दूँगी।",
    cardTitle: "दोबारा उपयोग होने वाली साझा कुंजी",
    cardBody:
      "Z4SK वाला QR सहेजें। उसी फोन पर बाद में उसे फ़ोटो से चुनें या रिकवरी वाक्य चिपकाएँ। ID केवल कुंजी पहचानता है; खोलता नहीं।",
    fingerprint: "कुंजी ID · रहस्य नहीं",
    phrase: "रिकवरी वाक्य",
    phraseHelp: "शब्द और QR एक ही कुंजी हैं, अतिरिक्त कारक नहीं।",
    copyWords: "रिकवरी वाक्य कॉपी करें",
    copied: "कॉपी हुआ",
    download: "स्थिर QR डाउनलोड करें",
    unlockTitle: "साझा कुंजी आवश्यक",
    unlockBody: "केवल लिंक से निमंत्रण नहीं खुलेगा। अलग से मिला QR स्कैन करें।",
    scan: "कैमरे से QR स्कैन करें",
    stop: "कैमरा रोकें",
    upload: "फ़ोटो से QR चुनें",
    words: "या 12 शब्द चिपकाएँ (पुरानी 24-शब्द कुंजियाँ भी चलेंगी)",
    unlock: "डिवाइस पर खोलें",
    invalid: "यह मान्य Z4SK QR या रिकवरी वाक्य नहीं है।",
    camera: "कैमरा उपलब्ध नहीं। चित्र अपलोड करें या शब्द लिखें।",
    working: "डिवाइस पर जाँच…",
    differentChannel:
      "यह कुंजी QR है, निमंत्रण QR नहीं। इसे निमंत्रण लिंक या QR से अलग भेजें। दोनों पाने वाला निमंत्रण खोल सकता है।",
  },
  ja: {
    protectTitle: "追加の共有鍵・任意",
    protectBody: "保護を強める場合は、別経路で渡す2つ目の秘密を使います。鍵を使わない場合、完全なリンクだけで招待を開けます。",
    generate: "新しい鍵を作成",
    existing: "既存のQRを使用",
    ready: "鍵の準備完了",
    replace: "別の鍵を使う",
    confirm: "自分のコピーを保存し、もう一方を別経路で渡します。",
    cardTitle: "再利用可能な共有鍵",
    cardBody: "Z4SK入りQRを保存してください。同じ端末では写真から選ぶか、復元フレーズを貼り付けます。IDは鍵を識別するだけで、解除には使えません。",
    fingerprint: "鍵ID・秘密ではありません",
    phrase: "復元フレーズ",
    phraseHelp: "単語とQRは同じ鍵で、追加要素ではありません。",
    copyWords: "復元フレーズをコピー",
    copied: "コピー済み",
    download: "固定QRを保存",
    unlockTitle: "共有鍵が必要です",
    unlockBody:
      "リンクだけでは開けません。別経路で受け取ったQRを読み取ってください。",
    scan: "カメラでQRを読む",
    stop: "カメラを停止",
    upload: "写真からQRを選ぶ",
    words: "または12語を貼り付け（従来の24語の鍵にも対応）",
    unlock: "端末内で解除",
    invalid: "有効なZ4SKのQRまたは復元語ではありません。",
    camera: "カメラを利用できません。画像または単語を使用してください。",
    working: "端末内で確認中…",
    differentChannel:
      "これは鍵QRで、招待QRではありません。招待リンクまたはQRとは別に送ってください。両方を持つ人は復号できます。",
  },
  tr: {
    protectTitle: "Ek anahtar · isteğe bağlı",
    protectBody: "Ek koruma için ayrı gönderilen ikinci bir sır iste. Anahtar olmadan tam bağlantı daveti açar.",
    generate: "Yeni anahtar oluştur",
    existing: "Mevcut QR kullan",
    ready: "Anahtar hazır",
    replace: "Başka anahtar kullan",
    confirm: "Kopyamı sakladım; diğerini farklı kanaldan ileteceğim.",
    cardTitle: "Yeniden kullanılabilir anahtar",
    cardBody:
      "Z4SK markalı QR'ı kaydet. Aynı telefonda daha sonra Fotoğraflar'dan seç veya kurtarma ifadesini yapıştır. ID yalnızca anahtarı tanımlar.",
    fingerprint: "ANAHTAR ID · SIR DEĞİL",
    phrase: "KURTARMA İFADESİ",
    phraseHelp: "Kelimeler QR ile aynı anahtardır; ek faktör değildir.",
    copyWords: "Kurtarma ifadesini kopyala",
    copied: "Kopyalandı",
    download: "Sabit QR indir",
    unlockTitle: "Paylaşılan anahtar gerekli",
    unlockBody: "Bağlantı tek başına daveti açmaz. Ayrı alınan QR'ı tara.",
    scan: "Kamerayla QR tara",
    stop: "Kamerayı durdur",
    upload: "Fotoğraflar'dan QR seç",
    words: "Veya 12 kelimeyi yapıştır (eski 24 kelimelik anahtarlar da çalışır)",
    unlock: "Yerel olarak aç",
    invalid: "Geçersiz Z4SK QR veya kurtarma ifadesi.",
    camera: "Kamera kullanılamadı. Görsel yükle veya kelimeleri gir.",
    working: "Yerel kontrol…",
    differentChannel:
      "Bu anahtar QR'ıdır, davet QR'ı değildir. Davet bağlantısı veya QR'ından ayrı gönder. İkisini alan daveti çözebilir.",
  },
  machine: {
    protectTitle: "SHARED_KEY::OPTIONAL",
    protectBody: "shared_key ? channels=2 : complete_link.decrypt=true",
    generate: "GENERATE key",
    existing: "IMPORT QR",
    ready: "KEY_READY",
    replace: "REPLACE_KEY",
    confirm: "ACK saved_copy=true AND channel_separation=true",
    cardTitle: "REUSABLE_SHARED_KEY",
    cardBody: "server.receive=false; persistence=false",
    fingerprint: "KEY_ID::NON_SECRET",
    phrase: "RECOVERY_PHRASE[12]",
    phraseHelp: "mnemonic==qr_key; additional_factor=false",
    copyWords: "COPY recovery_phrase",
    copied: "COPIED",
    download: "DOWNLOAD fixed_qr",
    unlockTitle: "SHARED_KEY_REQUIRED",
    unlockBody: "link_only.decrypt=false; SCAN second_channel_qr",
    scan: "SCAN camera",
    stop: "STOP camera",
    upload: "DECODE qr_image_from_photos",
    words: "OR INPUT words[12|legacy:24]",
    unlock: "LOCAL_UNLOCK",
    invalid: "ERR_SHARED_KEY_INVALID",
    camera: "ERR_CAMERA; USE file OR words",
    working: "LOCAL_VERIFY…",
    differentChannel:
      "key_qr!=invitation_qr; SEND_SEPARATELY; holder(invitation,key).decrypt=true",
  },
};
