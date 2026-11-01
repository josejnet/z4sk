"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopNav } from "../../components/Brand";
import { CANCELLATION_COPY } from "../../lib/cancellation-copy";
import { TOO_LATE_COPY } from "../../lib/too-late-copy";
import { LOCALES, type Locale, useLanguage } from "../../lib/i18n";

type Credential = { responseId: string; deletionToken: string };

export function CancelResponseClient({ id }: { id: string }) {
  const { locale, setLocale } = useLanguage();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState("");
  const [tooLate, setTooLate] = useState(false);

  useEffect(() => {
    queueMicrotask(()=>{const fragment = new URLSearchParams(window.location.hash.slice(1));
      const responseId = fragment.get("response") || "";
      const deletionToken = fragment.get("delete") || "";
      const requestedLocale = fragment.get("lang");
      if (LOCALES.some(({ id: localeId }) => localeId === requestedLocale)) setLocale(requestedLocale as Locale);
      if (/^[0-9a-f]{20}$/.test(responseId) && /^[0-9a-f]{48}$/.test(deletionToken)) setCredential({ responseId, deletionToken });
      setReady(true);});
  }, [setLocale]);

  const copy = CANCELLATION_COPY[locale];

  async function cancelResponse() {
    if (!credential || !window.confirm(copy.confirm)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/games/${id}/responses`, { method: "DELETE", headers: { "content-type": "application/json", authorization: `Bearer ${credential.deletionToken}` }, body: JSON.stringify({ responseId: credential.responseId }) });
      if (!response.ok) {
        if ([404, 410].includes(response.status)) { setTooLate(true); return; }
        throw new Error(copy.error);
      }
      window.history.replaceState({}, "", `/cancel/${id}`);
      setCredential(null); setDeleted(true);
    } catch { setError(copy.error); }
    finally { setBusy(false); }
  }

  if (!ready) return <main className="experience-page"><TopNav minimal /><div className="center-state"><div className="loader" /></div></main>;
  if (tooLate) return <main className="experience-page"><TopNav minimal /><div className="center-state cancellation-state too-late-state"><span className="large-symbol" aria-hidden="true">⌛</span><h1>{TOO_LATE_COPY[locale].title}</h1><p>{TOO_LATE_COPY[locale].answers}</p><Link href="/">Z4SK</Link></div></main>;
  if (deleted) return <main className="experience-page"><TopNav minimal /><div className="center-state cancellation-state"><span className="large-symbol cancellation-success">✓</span><h1>{copy.deleted}</h1><p>{copy.afterRead}</p><Link href="/">Z4SK</Link></div></main>;
  if (!credential) return <main className="experience-page"><TopNav minimal /><div className="center-state cancellation-state"><span className="large-symbol">×</span><h1>{copy.invalidTitle}</h1><p>{copy.invalidCopy}</p><Link href="/">Z4SK</Link></div></main>;
  return <main className="experience-page"><TopNav minimal /><div className="center-state cancellation-state"><span className="large-symbol">↩</span><div className="eyebrow">Z4SK · DELETE ONLY</div><h1>{copy.pageTitle}</h1><p>{copy.pageCopy}</p><p className="cancellation-warning">{copy.afterRead}</p>{error&&<p className="form-error" role="alert">{error}</p>}<button type="button" className="primary cancellation-action" disabled={busy} onClick={cancelResponse}>{busy ? "…" : copy.deleteButton}</button></div></main>;
}
