import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Tu panel privado · Pásalo", description: "Consulta las respuestas de tu cuestionario.", robots: { index: false, follow: false }, openGraph: { title: "Tu panel privado · Pásalo", description: "Consulta las respuestas de tu cuestionario.", images: [] }, twitter: { title: "Tu panel privado · Pásalo", description: "Consulta las respuestas de tu cuestionario.", images: [] } };
export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <DashboardClient id={id} />; }
