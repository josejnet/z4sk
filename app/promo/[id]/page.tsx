import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSchema, getDatabase, recordPublicMessageAccess } from "../../../db/runtime";
import { site } from "../../lib/site";
import "../../promo.css";

export const dynamic = "force-dynamic";

type PublicMessage = { id: string; title: string; message: string; theme: string; active: number };

export const metadata: Metadata = {
  title: "Z4SK · Ask. Answer. Dare.",
  description: "A public Z4SK message.",
  robots: { index: true, follow: true },
};

export default async function PromoPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const message = await getDatabase().prepare(`SELECT id, title, message, theme, active FROM founder_public_messages WHERE id = ? AND active = 1`).bind(id).first<PublicMessage>();
  if (!message) notFound();
  await recordPublicMessageAccess(id, await headers());
  const theme = ["original", "nightlife", "creator", "ocean", "solar", "aurora", "copper"].includes(message.theme) ? message.theme : "original";
  return <main className={`promo-page promo-theme-${theme}`}>
    <nav className="promo-nav"><Link href="/" className="promo-brand">Z4SK</Link><span>ASK · ANSWER · DARE</span></nav>
    <section className="promo-card" aria-labelledby="promo-title">
      <span className="promo-kicker">Z4SK · A QUESTION FOR YOU</span>
      <h1 id="promo-title">{message.title}</h1>
      <p className="promo-message">{message.message}</p>
      <a className="promo-cta" href={`${site.url}/?create=1`}>Create your own questions <span>→</span></a>
    </section>
    <footer className="promo-footer"><span>Private by design.</span><a href="/privacy">Privacy</a><a href="/safety">Safety</a></footer>
  </main>;
}
