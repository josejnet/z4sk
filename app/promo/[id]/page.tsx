import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ensureSchema, getDatabase, recordPublicMessageAccess } from "../../../db/runtime";
import "../../promo.css";
import { PublicPromoClient } from "./PublicPromoClient";

export const dynamic = "force-dynamic";

type PublicMessage = { id: string; title: string; message: string; theme: string; locale: string; questions_json: string; active: number };

export const metadata: Metadata = {
  title: "Z4SK · Ask. Answer. Dare.",
  description: "A public Z4SK message.",
  robots: { index: true, follow: true },
};

export default async function PromoPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const message = await getDatabase().prepare(`SELECT id, title, message, theme, locale, questions_json, active FROM founder_public_messages WHERE id = ? AND active = 1`).bind(id).first<PublicMessage>();
  if (!message) notFound();
  try {
    await recordPublicMessageAccess(id, await headers());
  } catch (error) {
    console.error("public-message-access-metric", error);
  }
  const theme = ["original", "nightlife", "creator", "ocean", "solar", "aurora", "copper"].includes(message.theme) ? message.theme : "original";
  let questions: string[] = [];
  try { const parsed = JSON.parse(message.questions_json); questions = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 12) : []; } catch { /* malformed legacy record */ }
  return <PublicPromoClient id={message.id} title={message.title} message={message.message} theme={theme} locale={message.locale} questions={questions} />;
}
