"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

type Promo = { id: string; title: string; message: string; locale: string; theme: string; active: number; created_at: string; updated_at: string };
type Props = { founderKey: string };

const themes = ["original", "nightlife", "creator", "ocean", "solar", "aurora", "copper"];

export function PromoManager({ founderKey }: Props) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [title, setTitle] = useState("Z4SK");
  const [message, setMessage] = useState("¿Te atreves a responder una pregunta que puede cambiarlo todo?");
  const [count, setCount] = useState(1);
  const [theme, setTheme] = useState("original");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/founder/promos", { cache: "no-store", headers: { authorization: `Bearer ${founderKey}` } });
      const result = await response.json() as { messages?: Promo[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load public messages.");
      setPromos(result.messages || []);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not load public messages."); }
    finally { setLoading(false); }
  }, [founderKey]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void load(); });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  async function create() {
    setStatus("");
    try {
      const response = await fetch("/api/founder/promos", { method: "POST", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ title, message, count, theme }) });
      const result = await response.json() as { created?: number; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not create public messages.");
      setStatus(`${result.created || count} public QR message${(result.created || count) === 1 ? "" : "s"} created.`);
      await load();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create public messages."); }
  }

  async function update(promo: Promo) {
    const response = await fetch("/api/founder/promos", { method: "PATCH", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify(promo) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not update message."); return; }
    setStatus("Public message updated.");
  }

  async function disable(id: string) {
    const response = await fetch("/api/founder/promos", { method: "DELETE", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not disable message."); return; }
    setPromos((current) => current.map((promo) => promo.id === id ? { ...promo, active: 0 } : promo));
    setStatus("Public message disabled. Its QR no longer shows the message.");
  }

  return <div className="promo-manager">
    <p className="metric-note">Generate public-only QR cards for posters, events or social posts. These messages are not invitations and never contain private data.</p>
    <div className="promo-create-grid">
      <label>Title<input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}>{themes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="promo-count">Copies<input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} /></label>
      <label className="promo-message-field">Public message<textarea value={message} maxLength={320} rows={3} onChange={(event) => setMessage(event.target.value)} /></label>
    </div>
    <button className="ad-save" type="button" onClick={() => void create()} disabled={!message.trim()}>Generate QR series</button>
    {status && <p className="ad-status" role="status">{status}</p>}
    <div className="promo-list">{loading ? <p>Loading public messages…</p> : promos.length ? promos.map((promo) => <PromoRow key={promo.id} promo={promo} onUpdate={update} onDisable={disable} />) : <p>No public QR messages yet.</p>}</div>
  </div>;
}

function PromoRow({ promo, onUpdate, onDisable }: { promo: Promo; onUpdate: (promo: Promo) => Promise<void>; onDisable: (id: string) => Promise<void> }) {
  const [draft, setDraft] = useState(promo);
  const [qr, setQr] = useState("");
  const url = typeof window === "undefined" ? `/promo/${promo.id}` : `${window.location.origin}/promo/${promo.id}`;
  useEffect(() => { void QRCode.toDataURL(url, { width: 720, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr); }, [url]);
  return <article className={`promo-row ${draft.active ? "" : "is-disabled"}`}>
    <div className="promo-row-qr">{qr && <Image src={qr} alt={`QR for ${draft.title}`} width={720} height={720} unoptimized />}</div>
    <div className="promo-row-fields">
      <span className="promo-row-id">{draft.active ? "PUBLIC · ACTIVE" : "PUBLIC · DISABLED"} · {draft.id}</span>
      <input value={draft.title} maxLength={80} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-label="Public message title" />
      <textarea value={draft.message} maxLength={320} rows={3} onChange={(event) => setDraft({ ...draft, message: event.target.value })} aria-label="Public message" />
      <code>{url}</code>
      <div className="promo-row-actions"><button type="button" onClick={() => void onUpdate(draft)} disabled={!draft.active}>Save text</button><button type="button" onClick={() => void navigator.clipboard?.writeText(url)}>Copy link</button><a href={qr} download={`z4sk-public-${draft.id}.png`} aria-disabled={!qr}>Download QR</a>{draft.active && <button type="button" onClick={() => void onDisable(draft.id)}>Disable</button>}</div>
    </div>
  </article>;
}
