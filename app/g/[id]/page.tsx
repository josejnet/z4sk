import type { Metadata } from "next";
import { GameClient } from "./GameClient";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Tienes preguntas pendientes · Z4SK";
  const description = "Alguien te ha enviado un cuestionario privado y cifrado.";
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}
export default async function GamePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <GameClient id={id} />; }
