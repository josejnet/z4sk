"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

type AccessItem = { label: string; count: number };
type AccessSummary = { views: number; activeDays: number; lastAccessAt: string | null; countries: AccessItem[]; languages: AccessItem[]; devices: AccessItem[]; referrers: AccessItem[] };
type PublicResponse = { id: string; name: string; answers: string[]; locale: string; country: string; device: string; createdAt: string };
type Promo = { id: string; title: string; message: string; locale: string; theme: string; questions: string[]; active: number; created_at: string; updated_at: string; access: AccessSummary; responses: PublicResponse[] };
type Props = { founderKey: string };

const themes = ["original", "nightlife", "creator", "ocean", "solar", "aurora", "copper"];

export function PromoManager({ founderKey }: Props) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("Z4SK");
  const [message, setMessage] = useState("¿Te atreves a responder una pregunta que puede cambiarlo todo?");
  const [questions, setQuestions] = useState("¿Qué te atreves a responder?\n¿Qué te gustaría que ocurriera?\n¿Qué no me has contado todavía?");
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

  useEffect(() => { const frame = window.requestAnimationFrame(() => { void load(); }); return () => window.cancelAnimationFrame(frame); }, [load]);

  async function create() {
    setStatus("");
    try {
      const response = await fetch("/api/founder/promos", { method: "POST", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ title, message, questions, count, theme }) });
      const result = await response.json() as { created?: number; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not create public messages.");
      setStatus(`${result.created || count} public QR message${(result.created || count) === 1 ? "" : "s"} created.`);
      await load();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create public messages."); }
  }

  async function update(promo: Promo) {
    const response = await fetch("/api/founder/promos", { method: "PATCH", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify(promo) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not update message."); return; }
    setPromos((current) => current.map((item) => item.id === promo.id ? promo : item));
    setStatus("Public message updated.");
  }

  async function disable(id: string) {
    const response = await fetch("/api/founder/promos", { method: "DELETE", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not disable message."); return; }
    setPromos((current) => current.map((promo) => promo.id === id ? { ...promo, active: 0 } : promo));
    setStatus("Public message disabled. Its QR no longer shows the message.");
  }

  async function deleteResponse(responseId: string) {
    const response = await fetch("/api/founder/promos", { method: "DELETE", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ responseId }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not delete answer."); return false; }
    setStatus("Answer deleted.");
    return true;
  }

  const selected = promos.find((promo) => promo.id === selectedId) || null;
  return <div className="promo-manager">
    <div className="promo-manager-intro"><p>Genera cuestionarios públicos reutilizables para carteles, eventos o redes. Cada QR conserva su dirección aunque edites las preguntas.</p><small>Las respuestas se leen solo aquí. Las estadísticas de acceso son agregadas y no guardan direcciones IP.</small></div>
    <div className="promo-create-grid">
      <label>Title<input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}>{themes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="promo-count">Copies<input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} /></label>
      <label className="promo-message-field">Public message<textarea value={message} maxLength={320} rows={3} onChange={(event) => setMessage(event.target.value)} /></label>
      <label className="promo-questions-field">Questions · one per line<textarea value={questions} maxLength={2200} rows={6} onChange={(event) => setQuestions(event.target.value)} /></label>
    </div>
    <button className="ad-save" type="button" onClick={() => void create()} disabled={!message.trim()}>Generate QR series</button>
    {status && <p className="ad-status" role="status">{status}</p>}
    {selected ? <PromoDetail promo={selected} onBack={() => setSelectedId(null)} onUpdate={update} onDisable={disable} onDeleteResponse={deleteResponse} /> : <div className="promo-list">{loading ? <p>Loading public messages…</p> : promos.length ? promos.map((promo) => <PromoListRow key={promo.id} promo={promo} onOpen={() => setSelectedId(promo.id)} />) : <p>No public QR messages yet.</p>}</div>}
  </div>;
}

function PromoListRow({ promo, onOpen }: { promo: Promo; onOpen: () => void }) {
  const [qr, setQr] = useState("");
  const url = typeof window === "undefined" ? `/promo/${promo.id}` : `${window.location.origin}/promo/${promo.id}`;
  useEffect(() => { void QRCode.toDataURL(url, { width: 720, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr); }, [url]);
  return <article className={`promo-row promo-list-row ${promo.active ? "" : "is-disabled"}`}><button className="promo-row-select" type="button" onClick={onOpen}><div className="promo-row-qr">{qr && <Image src={qr} alt={`QR for ${promo.title}`} width={720} height={720} unoptimized />}</div><div><span className="promo-row-id">{promo.active ? "PUBLIC · ACTIVE" : "PUBLIC · DISABLED"} · {promo.id}</span><h3>{promo.title}</h3><p>{promo.message}</p><div className="promo-row-summary"><span>{promo.questions.length} questions</span><span>{promo.responses.length} answers</span><span>{promo.access.views} scans</span></div></div><span className="promo-row-open">Open details →</span></button></article>;
}

function PromoDetail({ promo, onBack, onUpdate, onDisable, onDeleteResponse }: { promo: Promo; onBack: () => void; onUpdate: (promo: Promo) => Promise<void>; onDisable: (id: string) => Promise<void>; onDeleteResponse: (id: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState(promo);
  const [responses, setResponses] = useState(promo.responses);
  const [qr, setQr] = useState("");
  const url = typeof window === "undefined" ? `/promo/${promo.id}` : `${window.location.origin}/promo/${promo.id}`;
  useEffect(() => { setDraft(promo); setResponses(promo.responses); }, [promo]);
  useEffect(() => { void QRCode.toDataURL(url, { width: 1200, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr); }, [url]);
  return <section className="promo-detail"><div className="promo-detail-top"><button type="button" onClick={onBack}>← Back to public QR list</button><span>{draft.active ? "PUBLIC · ACTIVE" : "PUBLIC · DISABLED"}</span></div><div className="promo-detail-head"><div className="promo-detail-qr">{qr && <Image src={qr} alt={`QR for ${draft.title}`} width={1200} height={1200} unoptimized />}</div><div><span className="promo-row-id">{draft.id}</span><h3>{draft.title}</h3><p>This is the reusable QR page. Edit the text and questions without changing the address.</p><code>{url}</code><div className="promo-detail-actions"><button type="button" onClick={() => void navigator.clipboard?.writeText(url)}>Copy link</button>{qr && <button type="button" onClick={() => void downloadFlyer(draft, url, qr)}>Download branded PDF</button>}{draft.active && <button type="button" onClick={() => void onDisable(draft.id)}>Disable QR</button>}</div></div></div><div className="promo-detail-fields"><label>Title<input value={draft.title} maxLength={80} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Theme<select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}>{themes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="promo-message-field">Public message<textarea value={draft.message} maxLength={320} rows={3} onChange={(event) => setDraft({ ...draft, message: event.target.value })} /></label><label className="promo-questions-field">Questions · one per line<textarea value={draft.questions.join("\n")} maxLength={2200} rows={8} onChange={(event) => setDraft({ ...draft, questions: event.target.value.split(/\r?\n/).filter(Boolean) })} /></label></div><button className="ad-save" type="button" onClick={() => void onUpdate(draft)} disabled={!draft.active}>Save changes</button><div className="promo-access" aria-label="Aggregated access data"><div className="promo-access-kpis"><span><b>{promo.access.views}</b> scans</span><span><b>{promo.access.activeDays}</b> active days</span><span><b>{promo.access.lastAccessAt ? new Date(promo.access.lastAccessAt).toLocaleString() : "—"}</b> last access</span></div><AccessBreakdown title="Countries" rows={promo.access.countries} /><AccessBreakdown title="Languages" rows={promo.access.languages} /><AccessBreakdown title="Devices" rows={promo.access.devices} /><AccessBreakdown title="Referrers" rows={promo.access.referrers} /></div><div className="promo-responses promo-detail-inbox"><div className="promo-inbox-heading"><h3>Inbox · {responses.length}</h3><span>Answers received for this QR</span></div>{responses.length ? responses.map((response) => <article className="promo-response" key={response.id}><div className="promo-response-head"><div><b>{response.name}</b><small>{new Date(response.createdAt).toLocaleString()} · {response.locale} · {response.country}</small></div><button type="button" onClick={() => { if (window.confirm("Delete this answer permanently?")) void onDeleteResponse(response.id).then((deleted) => { if (deleted) setResponses((current) => current.filter((item) => item.id !== response.id)); }); }}>Delete</button></div>{response.answers.map((answer, index) => <p key={`${response.id}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b>{answer}</p>)}</article>) : <small>No answers yet.</small>}</div></section>;
}

async function downloadFlyer(promo: Promo, url: string, qr: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(14, 14, 14); doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(255, 90, 31); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Z4SK · ASK · ANSWER · DARE", 20, 24);
  doc.setTextColor(244, 238, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.text("Una pregunta para ti.", 20, 49);
  doc.setTextColor(190, 181, 173); doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.text(doc.splitTextToSize(promo.message, 105), 20, 62, { lineHeightFactor: 1.45 });
  doc.setFillColor(255, 255, 255); doc.roundedRect(125, 36, 65, 65, 3, 3, "F"); doc.addImage(qr, "PNG", 129, 40, 57, 57);
  doc.setTextColor(255, 90, 31); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("ESCANEA EL QR", 125, 112);
  doc.setTextColor(244, 238, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("Responde sin registrarte", 20, 119);
  doc.setTextColor(190, 181, 173); doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.text(["1. Escanea el código con tu móvil.", "2. Lee las preguntas y responde las que quieras.", "3. Envía tus respuestas y vuelve más tarde."], 20, 132, { lineHeightFactor: 1.65 });
  doc.setDrawColor(70, 61, 56); doc.line(20, 171, 190, 171); doc.setTextColor(255, 90, 31); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("ALGUNAS PREGUNTAS", 20, 185);
  doc.setTextColor(244, 238, 232); doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.text(doc.splitTextToSize(promo.questions.map((question, index) => `${String(index + 1).padStart(2, "0")}  ${question}`).join("\n"), 170), 20, 198, { lineHeightFactor: 1.55 });
  doc.setTextColor(130, 120, 112); doc.setFontSize(9); doc.text(url, 20, 265); doc.setTextColor(255, 90, 31); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("z4sk.xyz", 20, 280); doc.save(`z4sk-${promo.id}.pdf`);
}

function AccessBreakdown({ title, rows }: { title: string; rows: AccessItem[] }) { return <div className="promo-access-breakdown"><strong>{title}</strong>{rows.length ? rows.map((row) => <span key={row.label}><em>{row.label}</em><b>{row.count}</b></span>) : <small>No data yet</small>}</div>; }
