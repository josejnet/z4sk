"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/i18n";
import { drawOrganicQr } from "../lib/organic-qr";
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
    ])
      .then(async ([payload, nextFingerprint]) => {
        if (!active || !canvasRef.current) return;
        const qr = document.createElement("canvas");
        await drawOrganicQr(qr, payload, { targetSize: 500 });
        if (!active) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas");
        canvas.width = 1200;
        const mnemonic = showRecovery ? sharedKeyToMnemonic(sharedKey) : "";
        canvas.height = 800;
        context.fillStyle = "#0b0b0b";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const glow = context.createRadialGradient(600, 80, 20, 600, 80, 420);
        glow.addColorStop(0, "rgba(255,90,31,.28)");
        glow.addColorStop(1, "rgba(11,11,11,0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, canvas.width, 420);
        context.fillStyle = "#ff5a1f";
        context.fillRect(0, 0, 12, canvas.height);
        context.fillStyle = "#f4efe8";
        context.font = "800 30px Arial, sans-serif";
        context.letterSpacing = "7px";
        context.fillText("Z4SK", 52, 72);
        context.letterSpacing = "0px";
        context.fillStyle = "#aaa19a";
        context.font = "700 18px Arial, 'Noto Sans', sans-serif";
        context.fillText(copy.cardTitle.toUpperCase(), 52, 116);
        context.fillStyle = "#ffffff";
        context.fillRect(70, 150, 560, 560);
        context.drawImage(
          qr,
          350 - qr.width / 2,
          430 - qr.height / 2,
          500,
          500,
        );
        context.strokeStyle = "#ff5a1f";
        context.lineWidth = 4;
        context.strokeRect(70, 150, 560, 560);
        context.fillStyle = "#77706a";
        context.font = "700 15px Arial, 'Noto Sans', sans-serif";
        context.fillText(copy.fingerprint, 70, 750);
        context.fillStyle = "#f4efe8";
        context.font = "700 24px monospace";
        context.fillText(nextFingerprint, 70, 785);
        context.fillStyle = "#ff5a1f";
        context.font = "700 16px Arial, sans-serif";
        context.fillText("Z4SK · E2EE · 128 BIT", 70, 815);
        if (mnemonic) {
          context.fillStyle = "#77706a";
          context.font = "700 15px Arial, 'Noto Sans', sans-serif";
          const phraseX = 700;
          context.fillText(copy.phrase, phraseX, 165);
          context.fillStyle = "#f4efe8";
          context.font = "700 22px Arial, 'Noto Sans', sans-serif";
          mnemonic.split(" ").forEach((word, index) => {
            context.fillText(`${String(index + 1).padStart(2, "0")}  ${word}`, phraseX, 210 + index * 42);
          });
        }
        setRendered({
          key: sharedKey,
          fingerprint: nextFingerprint,
          mnemonic,
        });
      })
      .catch(() => {
        if (active) setRendered({ key: "", fingerprint: "", mnemonic: "" });
      });
    return () => {
      active = false;
    };
  }, [copy.cardTitle, copy.fingerprint, copy.phrase, sharedKey, showRecovery]);

  async function copyPhrase() {
    if (!rendered.mnemonic) return;
    await navigator.clipboard.writeText(rendered.mnemonic);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas || rendered.key !== sharedKey) return;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("image"))),
        "image/png",
      ),
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `z4sk-shared-key-${rendered.fingerprint || "private"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  const ready = rendered.key === sharedKey;
  const recoveryPhrase = ready ? rendered.mnemonic.normalize("NFC") : "";
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
            <div className="shared-key-recovery-label">{copy.phrase}</div>
            <p>{copy.phraseHelp}</p>
            <p className="shared-key-phrase" lang="es">
              {recoveryPhrase}
            </p>
          </div>
        )}
      </div>
      <div className="shared-key-card-actions">
        <button
          type="button"
          disabled={!ready}
          onClick={() => void download()}
        >
          {copy.download}
        </button>
        {showRecovery && (
          <button
            type="button"
            disabled={!rendered.mnemonic}
            onClick={copyPhrase}
          >
            {copied ? copy.copied : copy.copyWords}
          </button>
        )}
      </div>
    </section>
  );
}
