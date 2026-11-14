"use client";

import { useState } from "react";
import Link from "next/link";

type Props = { id: string; title: string; message: string; theme: string; locale: string; questions: string[] };

const copy: Record<string, { name: string; namePlaceholder: string; answer: string; send: string; sent: string; error: string; privacy: string }> = {
  en: { name: "Your name", namePlaceholder: "e.g. Alex", answer: "Your answer", send: "Send your answers", sent: "Answer sent. Maybe someone will dare to answer you next.", error: "Could not send your answers.", privacy: "Your answer is visible to the owner of this public QR." },
  es: { name: "Tu nombre", namePlaceholder: "Ej. Alex", answer: "Tu respuesta", send: "Enviar respuestas", sent: "Respuesta enviada. Quizá ahora alguien se atreva a responderte.", error: "No se pudieron enviar tus respuestas.", privacy: "Tu respuesta será visible para quien creó este QR público." },
  fr: { name: "Votre nom", namePlaceholder: "Ex. Alex", answer: "Votre réponse", send: "Envoyer les réponses", sent: "Réponse envoyée.", error: "Impossible d’envoyer vos réponses.", privacy: "Votre réponse sera visible par la personne qui a créé ce QR public." },
  de: { name: "Dein Name", namePlaceholder: "z. B. Alex", answer: "Deine Antwort", send: "Antworten senden", sent: "Antwort gesendet.", error: "Antworten konnten nicht gesendet werden.", privacy: "Deine Antwort ist für die Person sichtbar, die diesen öffentlichen QR erstellt hat." },
};

export function PublicPromoClient({ id, title, message, theme, locale, questions }: Props) {
  const words = copy[locale] || copy.en;
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch(`/api/promo/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ respondentName: name, answers }) });
    if (!response.ok) { const result = await response.json().catch(() => ({})) as { error?: string }; setError(result.error || words.error); return; }
    setSent(true);
  }
  return <main className={`promo-page promo-theme-${theme}`}>
    <nav className="promo-nav"><Link href="/" className="promo-brand">Z4SK</Link><span>ASK · ANSWER · DARE</span></nav>
    <section className="promo-card" aria-labelledby="promo-title">
      <span className="promo-kicker">Z4SK · A QUESTION FOR YOU</span>
      <h1 id="promo-title">{title}</h1>
      <p className="promo-message">{message}</p>
      {sent ? <div className="promo-sent" role="status"><b>✓</b><h2>{words.sent}</h2><p>{words.privacy}</p></div> : <form className="promo-form" onSubmit={submit}>
        <label>{words.name}<input required maxLength={80} value={name} placeholder={words.namePlaceholder} onChange={(event) => setName(event.target.value)} /></label>
        {questions.map((question, index) => <label key={`${question}-${index}`}><span className="promo-question-number">{String(index + 1).padStart(2, "0")}</span>{question}<textarea required maxLength={1000} rows={3} value={answers[index]} placeholder={words.answer} onChange={(event) => setAnswers((current) => current.map((answer, item) => item === index ? event.target.value : answer))} /></label>)}
        {error && <p className="promo-error" role="alert">{error}</p>}
        <p className="promo-privacy-note">{words.privacy}</p>
        <button className="promo-cta" type="submit">{words.send}<span>→</span></button>
      </form>}
    </section>
    <footer className="promo-footer"><span>Private by design.</span><a href="/privacy">Privacy</a><a href="/safety">Safety</a></footer>
  </main>;
}
