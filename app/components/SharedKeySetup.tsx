"use client";

import { useState } from "react";
import type { Locale } from "../lib/i18n";
import { generateSharedKey } from "../lib/shared-key";
import { SHARED_KEY_COPY } from "../lib/shared-key-copy";
import { SharedKeyCard } from "./SharedKeyCard";
import { SharedKeyUnlock } from "./SharedKeyUnlock";

export function SharedKeySetup({
  locale,
  sharedKey,
  confirmed,
  linkOnly,
  onChange,
  onConfirm,
  onLinkOnly,
  onCreate,
}: {
  locale: Locale;
  sharedKey: string;
  confirmed: boolean;
  linkOnly: boolean;
  onChange: (key: string) => void;
  onConfirm: (value: boolean) => void;
  onLinkOnly: (value: boolean) => void;
  onCreate: (sharedKey: string, linkOnly: boolean) => void;
}) {
  const copy = SHARED_KEY_COPY[locale];
  const protectionReminder: Record<Locale, string> = {
    en: "Think of it as a real key: keep it and share copies with the other person. The same key works in both directions for multiple messages over time. The next step gives you a lock that needs this key to open.",
    es: "Piensa en ella como una llave real: guárdala y comparte copias con la otra persona. La misma clave funciona en ambas direcciones para enviar muchos mensajes durante el tiempo. En el siguiente paso recibirás una cerradura que solo se abre con esta llave.",
    it: "Pensala come una vera chiave: conservala e condividila con l'altra persona. La stessa chiave funziona in entrambe le direzioni per molti messaggi nel tempo. Nel passaggio successivo avrai una serratura che si apre solo con questa chiave.",
    fr: "Pensez-y comme à une vraie clé : gardez-la et partagez-en des copies. La même clé fonctionne dans les deux sens pour plusieurs messages. À l'étape suivante, vous recevrez une serrure qui ne s'ouvre qu'avec cette clé.",
    de: "Betrachte sie wie einen echten Schlüssel: Bewahre ihn auf und teile Kopien. Derselbe Schlüssel funktioniert in beide Richtungen für viele Nachrichten. Im nächsten Schritt erhältst du ein Schloss, das nur mit diesem Schlüssel aufgeht.",
    nl: "Zie het als een echte sleutel: bewaar hem en deel kopieën. Dezelfde sleutel werkt in beide richtingen voor meerdere berichten. In de volgende stap krijg je een slot dat alleen met deze sleutel opengaat.",
    eo: "Pensu pri ĝi kiel pri vera ŝlosilo: konservu ĝin kaj dividu kopiojn. La sama ŝlosilo funkcias en ambaŭ direktoj por multaj mesaĝoj. En la sekva paŝo vi ricevos seruron, kiu malfermiĝas nur per ĉi tiu ŝlosilo.",
    pt: "Pensa nela como numa chave real: guarda-a e partilha cópias. A mesma chave funciona nos dois sentidos para várias mensagens. No passo seguinte vais receber uma fechadura que só abre com esta chave.",
    zh: "把它当作真正的钥匙：请保存并与对方共享副本。同一把钥匙可以双向使用，发送多条消息。下一步会给你一把只有这把钥匙才能打开的锁。",
    hi: "इसे असली चाबी की तरह समझें: इसे संभालकर रखें और दूसरे व्यक्ति के साथ प्रतियाँ साझा करें। यही चाबी दोनों दिशाओं में कई संदेशों के लिए काम करती है। अगले चरण में आपको ऐसा ताला मिलेगा जो इसी चाबी से खुलेगा।",
    ja: "本物の鍵のように扱ってください。保存して相手とコピーを共有します。同じ鍵を双方向で使い、複数のメッセージを送れます。次のステップでは、この鍵でしか開かない錠を渡します。",
    tr: "Bunu gerçek bir anahtar gibi düşün: sakla ve diğer kişiyle kopyalarını paylaş. Aynı anahtar iki yönde de birçok mesaj için çalışır. Sonraki adımda yalnızca bu anahtarla açılan bir kilit alacaksın.",
    machine: "KEY=reusable; direction=bidirectional; messages=many; lifetime=ongoing",
  };
  const [showImport, setShowImport] = useState(false);

  function create() {
    setShowImport(false);
    onLinkOnly(false);
    onChange(generateSharedKey());
  }

  function replace() {
    setShowImport(false);
    onLinkOnly(false);
    onChange("");
  }

  function chooseLinkOnly() {
    setShowImport(false);
    onChange("");
    onConfirm(false);
    onLinkOnly(true);
    onCreate("", true);
  }

  if (sharedKey)
    return (
      <section className="shared-key-setup ready">
        <div className="shared-key-setup-title">
          <span>✓</span>
          <div>
            <h3>{copy.ready}</h3>
            <p>{copy.protectBody}</p>
            <p className="shared-key-explanation">{protectionReminder[locale]}</p>
          </div>
          <button type="button" onClick={replace}>
            {copy.replace}
          </button>
        </div>
        <SharedKeyCard
          locale={locale}
          sharedKey={sharedKey}
          showRecovery
          footer={
            <label id="shared-key-confirmation" className="shared-key-confirm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => {
                  const next = event.target.checked;
                  onConfirm(next);
                  if (next) onCreate(sharedKey, false);
                }}
              />
              <span>{copy.confirm}</span>
            </label>
          }
        />
      </section>
    );

  if (linkOnly)
    return (
      <section className="shared-key-setup ready link-only-ready">
        <div className="shared-key-setup-title">
          <span>✓</span>
          <div>
            <h3>{copy.linkOnlyReady}</h3>
            <p>{copy.linkOnlyBody}</p>
          </div>
          <button type="button" onClick={() => onLinkOnly(false)}>
            {copy.changeProtection}
          </button>
        </div>
      </section>
    );

  return (
    <section className="shared-key-setup">
      <div className="shared-key-setup-title">
        <span>◇</span>
        <div>
          <h3>{copy.protectTitle}</h3>
          <p>{copy.protectBody}</p>
          <p className="shared-key-explanation">{protectionReminder[locale]}</p>
        </div>
      </div>
      <div className="shared-key-choice">
        <button type="button" onClick={create}>
          {copy.generate}
        </button>
        <button type="button" onClick={() => setShowImport((value) => !value)}>
          {copy.existing}
        </button>
        <button
          type="button"
          className="link-only-choice"
          onClick={chooseLinkOnly}
        >
          {copy.linkOnly}
        </button>
      </div>
      {showImport && (
        <SharedKeyUnlock
          compact
          locale={locale}
          onKey={(key) => {
            setShowImport(false);
            onLinkOnly(false);
            onChange(key);
            onConfirm(true);
            onCreate(key, false);
          }}
        />
      )}
    </section>
  );
}
