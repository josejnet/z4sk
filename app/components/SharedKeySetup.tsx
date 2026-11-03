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
}: {
  locale: Locale;
  sharedKey: string;
  confirmed: boolean;
  linkOnly: boolean;
  onChange: (key: string, generated: boolean) => void;
  onConfirm: (value: boolean) => void;
  onLinkOnly: (value: boolean) => void;
}) {
  const copy = SHARED_KEY_COPY[locale];
  const [showImport, setShowImport] = useState(false);
  const [generated, setGenerated] = useState(false);

  function create() {
    setGenerated(true);
    setShowImport(false);
    onLinkOnly(false);
    onChange(generateSharedKey(), true);
  }

  function replace() {
    setGenerated(false);
    setShowImport(false);
    onLinkOnly(false);
    onChange("", false);
  }

  function chooseLinkOnly() {
    setGenerated(false);
    setShowImport(false);
    onChange("", false);
    onConfirm(false);
    onLinkOnly(true);
  }

  if (sharedKey)
    return (
      <section className="shared-key-setup ready">
        <div className="shared-key-setup-title">
          <span>✓</span>
          <div>
            <h3>{copy.ready}</h3>
            <p>{copy.protectBody}</p>
          </div>
          <button type="button" onClick={replace}>
            {copy.replace}
          </button>
        </div>
        <SharedKeyCard
          locale={locale}
          sharedKey={sharedKey}
          showRecovery={generated}
        />
        <label id="shared-key-confirmation" className="shared-key-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirm(event.target.checked)}
          />
          <span>{copy.confirm}</span>
        </label>
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
            setGenerated(false);
            setShowImport(false);
            onLinkOnly(false);
            onChange(key, false);
            onConfirm(true);
          }}
        />
      )}
    </section>
  );
}
