"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/i18n";
import { SHARED_KEY_COPY } from "../lib/shared-key-copy";
import {
  encodeSharedKeyQr,
  sharedKeyFingerprint,
  sharedKeyToMnemonic,
} from "../lib/shared-key";

export function SharedKeyCard({
  locale,
  sharedKey,
  showRecovery = true,
}: {
  locale: Locale;
  sharedKey: string;
  showRecovery?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState({
    key: "",
    fingerprint: "",
    mnemonic: "",
  });
  const [copied, setCopied] = useState(false);
  const copy = SHARED_KEY_COPY[locale];

  useEffect(() => {
    let active = true;
    void Promise.all([
      encodeSharedKeyQr(sharedKey),
      sharedKeyFingerprint(sharedKey),
      import("qrcode"),
    ])
      .then(async ([payload, nextFingerprint, module]) => {
        if (!active || !canvasRef.current) return;
        await module.default.toCanvas(canvasRef.current, payload, {
          width: 360,
          margin: 3,
          errorCorrectionLevel: "H",
          color: { dark: "#080808", light: "#ffffff" },
        });
        if (!active) return;
        setRendered({
          key: sharedKey,
          fingerprint: nextFingerprint,
          mnemonic: showRecovery ? sharedKeyToMnemonic(sharedKey) : "",
        });
      })
      .catch(() => {
        if (active) setRendered({ key: "", fingerprint: "", mnemonic: "" });
      });
    return () => {
      active = false;
    };
  }, [sharedKey, showRecovery]);

  async function copyWords() {
    if (!rendered.mnemonic) return;
    await navigator.clipboard.writeText(rendered.mnemonic);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || rendered.key !== sharedKey) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `z4sk-shared-key-${rendered.fingerprint || "private"}.png`;
    link.click();
  }

  const ready = rendered.key === sharedKey;
  const words = ready ? rendered.mnemonic.split(" ").filter(Boolean) : [];
  return (
    <section className="shared-key-card" aria-label={copy.cardTitle}>
      <div className="shared-key-card-head">
        <span>◇</span>
        <div>
          <h4>{copy.cardTitle}</h4>
          <p>{copy.cardBody}</p>
        </div>
      </div>
      <p className="shared-key-channel-warning">
        <b>!</b>
        {copy.differentChannel}
      </p>
      <div className="shared-key-card-grid">
        <div>
          <canvas ref={canvasRef} aria-label={copy.cardTitle} />
          {ready && rendered.fingerprint && (
            <p className="shared-key-fingerprint">
              <span>{copy.fingerprint}</span>
              <code>{rendered.fingerprint}</code>
            </p>
          )}
        </div>
        {showRecovery && (
          <div className="shared-key-recovery">
            <span>{copy.phrase}</span>
            <p>{copy.phraseHelp}</p>
            <ol>
              {words.map((word, index) => (
                <li key={`${word}-${index}`}>
                  <small>{index + 1}</small>
                  {word.normalize("NFC")}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <div className="shared-key-card-actions">
        <button type="button" disabled={!ready} onClick={download}>
          {copy.download}
        </button>
        {showRecovery && (
          <button type="button" disabled={!rendered.mnemonic} onClick={copyWords}>
            {copied ? copy.copied : copy.copyWords}
          </button>
        )}
      </div>
    </section>
  );
}
