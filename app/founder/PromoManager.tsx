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
const themeNames: Record<string, string> = { original: "Original", nightlife: "Noche", creator: "Creador", ocean: "Océano", solar: "Solar", aurora: "Aurora", copper: "Cobre" };
const flyerPhrases = ["No me atrevía a decírtelo por WhatsApp.", "Te lo dejo aquí porque decirlo en persona cuesta.", "Hay una pregunta que prefiero que leas tú.", "Si te atreves, escanea.", "Esto no sabía cómo enviártelo.", "Una pregunta. Una respuesta. Sin registro.", "Lo que quiero preguntarte no cabe en un mensaje.", "Quizá esto te saque una sonrisa.", "Abre esto cuando estés a solas.", "Una pequeña señal para ti.", "No es spam. Es una pregunta.", "Te toca responder."];
const flyerColors = ["#ff5a1f", "#ff3b9d", "#7dffbf", "#52c7ff", "#ff8066", "#4fe0c0", "#e8a15d"];

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
      setStatus(`Se han creado ${result.created || count} QR público${(result.created || count) === 1 ? "" : "s"}.`);
      await load();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not create public messages."); }
  }

  async function update(promo: Promo) {
    const response = await fetch("/api/founder/promos", { method: "PATCH", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify(promo) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not update message."); return; }
    setPromos((current) => current.map((item) => item.id === promo.id ? promo : item));
      setStatus("Mensaje público actualizado.");
  }

  async function disable(id: string) {
    const response = await fetch("/api/founder/promos", { method: "DELETE", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not disable message."); return; }
    setPromos((current) => current.map((promo) => promo.id === id ? { ...promo, active: 0 } : promo));
    setStatus("Mensaje público desactivado. Su QR ya no muestra el mensaje.");
  }

  async function deleteResponse(responseId: string) {
    const response = await fetch("/api/founder/promos", { method: "DELETE", headers: { authorization: `Bearer ${founderKey}`, "content-type": "application/json" }, body: JSON.stringify({ responseId }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; setStatus(result.error || "Could not delete answer."); return false; }
    setStatus("Respuesta eliminada.");
    return true;
  }

  const selected = promos.find((promo) => promo.id === selectedId) || null;
  return <div className="promo-manager">
    <div className="promo-manager-intro"><p>Genera cuestionarios públicos reutilizables para carteles, eventos o redes. Cada QR conserva su dirección aunque edites las preguntas.</p><small>Las respuestas se leen solo aquí. Las estadísticas de acceso son agregadas y no guardan direcciones IP.</small></div>
    <div className="promo-create-grid">
      <label>Título<input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Tema<select value={theme} onChange={(event) => setTheme(event.target.value)}>{themes.map((item) => <option key={item} value={item}>{themeNames[item]}</option>)}</select></label>
      <label className="promo-count">Copias<input type="number" min={1} max={50} value={count} onChange={(event) => setCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} /></label>
      <label className="promo-message-field">Mensaje público<textarea value={message} maxLength={320} rows={3} onChange={(event) => setMessage(event.target.value)} /></label>
      <label className="promo-questions-field">Preguntas · una por línea<textarea value={questions} maxLength={2200} rows={6} onChange={(event) => setQuestions(event.target.value)} /></label>
    </div>
    <button className="ad-save" type="button" onClick={() => void create()} disabled={!message.trim()}>Generar serie de QR</button>
    {status && <p className="ad-status" role="status">{status}</p>}
    {selected ? <PromoDetail promo={selected} onBack={() => setSelectedId(null)} onUpdate={update} onDisable={disable} onDeleteResponse={deleteResponse} /> : <div className="promo-list">{loading ? <p>Cargando QR públicos…</p> : promos.length ? promos.map((promo) => <PromoListRow key={promo.id} promo={promo} onOpen={() => setSelectedId(promo.id)} />) : <p>Todavía no hay QR públicos.</p>}</div>}
  </div>;
}

function PromoListRow({ promo, onOpen }: { promo: Promo; onOpen: () => void }) {
  const [qr, setQr] = useState("");
  const url = typeof window === "undefined" ? `/promo/${promo.id}` : `${window.location.origin}/promo/${promo.id}`;
  useEffect(() => { void QRCode.toDataURL(url, { width: 720, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr); }, [url]);
  return <article className={`promo-row promo-list-row ${promo.active ? "" : "is-disabled"}`}><button className="promo-row-select" type="button" onClick={onOpen}><div className="promo-row-qr">{qr && <Image src={qr} alt={`QR de ${promo.title}`} width={720} height={720} unoptimized />}</div><div><span className="promo-row-id">{promo.active ? "PÚBLICO · ACTIVO" : "PÚBLICO · DESACTIVADO"} · {promo.id}</span><h3>{promo.title}</h3><p>{promo.message}</p><div className="promo-row-summary"><span>{promo.questions.length} preguntas</span><span>{promo.responses.length} respuestas</span><span>{promo.access.views} escaneos</span></div></div><span className="promo-row-open">Abrir datos →</span></button></article>;
}

function PromoDetail({ promo, onBack, onUpdate, onDisable, onDeleteResponse }: { promo: Promo; onBack: () => void; onUpdate: (promo: Promo) => Promise<void>; onDisable: (id: string) => Promise<void>; onDeleteResponse: (id: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState(promo);
  const [responses, setResponses] = useState(promo.responses);
  const [qr, setQr] = useState("");
  const url = typeof window === "undefined" ? `/promo/${promo.id}` : `${window.location.origin}/promo/${promo.id}`;
  useEffect(() => { void QRCode.toDataURL(url, { width: 1200, margin: 2, color: { dark: "#111111", light: "#ffffff" } }).then(setQr); }, [url]);
  return <section className="promo-detail"><div className="promo-detail-top"><button type="button" onClick={onBack}>← Volver a QR públicos</button><span>{draft.active ? "PÚBLICO · ACTIVO" : "PÚBLICO · DESACTIVADO"}</span></div><div className="promo-detail-head"><div className="promo-detail-qr">{qr && <Image src={qr} alt={`QR de ${draft.title}`} width={1200} height={1200} unoptimized />}</div><div><span className="promo-row-id">{draft.id}</span><h3>{draft.title}</h3><p>Este QR es reutilizable: edita el texto y las preguntas sin cambiar su dirección.</p><code>{url}</code><div className="promo-detail-actions"><button type="button" onClick={() => void navigator.clipboard?.writeText(url)}>Copiar enlace</button>{qr && <button type="button" onClick={() => void downloadFlyer(draft, url, qr)}>Descargar folio PDF · 12 tarjetas</button>}{draft.active && <button type="button" onClick={() => void onDisable(draft.id)}>Desactivar QR</button>}</div></div></div><div className="promo-detail-fields"><label>Título<input value={draft.title} maxLength={80} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Tema<select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}>{themes.map((item) => <option key={item} value={item}>{themeNames[item]}</option>)}</select></label><label className="promo-message-field">Mensaje público<textarea value={draft.message} maxLength={320} rows={3} onChange={(event) => setDraft({ ...draft, message: event.target.value })} /></label><label className="promo-questions-field">Preguntas · una por línea<textarea value={draft.questions.join("\n")} maxLength={2200} rows={8} onChange={(event) => setDraft({ ...draft, questions: event.target.value.split(/\r?\n/).filter(Boolean) })} /></label></div><button className="ad-save" type="button" onClick={() => void onUpdate(draft)} disabled={!draft.active}>Guardar cambios</button><div className="promo-access" aria-label="Datos de acceso agregados"><div className="promo-access-kpis"><span><b>{promo.access.views}</b> escaneos</span><span><b>{promo.access.activeDays}</b> días activos</span><span><b>{promo.access.lastAccessAt ? new Date(promo.access.lastAccessAt).toLocaleString() : "—"}</b> último acceso</span></div><AccessBreakdown title="Países" rows={promo.access.countries} /><AccessBreakdown title="Idiomas" rows={promo.access.languages} /><AccessBreakdown title="Dispositivos" rows={promo.access.devices} /><AccessBreakdown title="Procedencia" rows={promo.access.referrers} /></div><div className="promo-responses promo-detail-inbox"><div className="promo-inbox-heading"><h3>Bandeja · {responses.length}</h3><span>Respuestas recibidas para este QR</span></div>{responses.length ? responses.map((response) => <article className="promo-response" key={response.id}><div className="promo-response-head"><div><b>{response.name}</b><small>{new Date(response.createdAt).toLocaleString()} · {response.locale} · {response.country}</small></div><button type="button" onClick={() => { if (window.confirm("¿Eliminar esta respuesta definitivamente?")) void onDeleteResponse(response.id).then((deleted) => { if (deleted) setResponses((current) => current.filter((item) => item.id !== response.id)); }); }}>Eliminar</button></div>{response.answers.map((answer, index) => <p key={`${response.id}-${index}`}><b>{String(index + 1).padStart(2, "0")}</b>{answer}</p>)}</article>) : <small>Todavía no hay respuestas.</small>}</div></section>;
}

async function downloadFlyer(promo: Promo, url: string, qr: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadImageData("/icon-192.png");
  doc.setFillColor(10, 10, 10); doc.rect(0, 0, 210, 297, "F");
  const margin = 8, gap = 4, columns = 3, rows = 4, cardWidth = (210 - margin * 2 - gap * (columns - 1)) / columns, cardHeight = (297 - margin * 2 - gap * (rows - 1)) / rows;
  flyerPhrases.forEach((phrase, index) => { const color = flyerColors[index % flyerColors.length]; const x = margin + (index % columns) * (cardWidth + gap); const y = margin + Math.floor(index / columns) * (cardHeight + gap); const qrSize = 20; const qrX = x + cardWidth - qrSize - 5; const qrY = y + cardHeight - qrSize - 8; doc.setFillColor(22, 22, 22); doc.setDrawColor(color); doc.setLineWidth(0.6); doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, "FD"); if (logo) doc.addImage(logo, "PNG", x + 5, y + 5, 9, 9); doc.setTextColor(color); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("Z4SK", x + 17, y + 12); doc.setTextColor(248, 243, 238); doc.setFontSize(10.5); doc.text(doc.splitTextToSize(phrase, cardWidth - 10), x + 5, y + 27, { lineHeightFactor: 1.25 }); doc.setFillColor(255, 255, 255); doc.rect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, "F"); doc.addImage(qr, "PNG", qrX, qrY, qrSize, qrSize); doc.setTextColor(color); doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.text("ESCANEA · RESPONDE", x + 5, y + cardHeight - 10); doc.setDrawColor(color); doc.setLineWidth(0.4); doc.line(x + 5, y + cardHeight - 7, x + cardWidth - qrSize - 10, y + cardHeight - 7); doc.setTextColor(248, 243, 238); doc.setFontSize(8.5); doc.text("z4sk.xyz", x + 5, y + cardHeight - 2.5); });
  doc.save(`z4sk-folios-${promo.id}-12-tarjetas.pdf`);
}

async function loadImageData(path: string) { const response = await fetch(path); if (!response.ok) return ""; const blob = await response.blob(); return await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : ""); reader.onerror = () => resolve(""); reader.readAsDataURL(blob); }); }

function AccessBreakdown({ title, rows }: { title: string; rows: AccessItem[] }) { return <div className="promo-access-breakdown"><strong>{title}</strong>{rows.length ? rows.map((row) => <span key={row.label}><em>{row.label}</em><b>{row.count}</b></span>) : <small>Sin datos todavía</small>}</div>; }
