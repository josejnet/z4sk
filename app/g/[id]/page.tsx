import type { Metadata } from "next";
import { GameClient } from "./GameClient";
import { ensureSchema, getDatabase } from "../../../db/runtime";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await ensureSchema();
  const game = await getDatabase().prepare(`SELECT creator_name, recipient_name FROM games WHERE id = ?`).bind(id).first<{ creator_name: string; recipient_name: string }>();
  const title = game ? `${game.recipient_name}, ${game.creator_name} tiene preguntas para ti · Z4SK` : "Tienes preguntas pendientes · Z4SK";
  const description = game ? `Responde al cuestionario privado que ${game.creator_name} ha creado para ti.` : "Alguien te ha enviado un cuestionario privado.";
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}
export default async function GamePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <GameClient id={id} />; }
