import type { Metadata } from "next";
import { CancelResponseClient } from "./CancelResponseClient";

export const metadata: Metadata = {
  title: "Cancel response · Z4SK",
  robots: { index: false, follow: false },
};

export default async function CancelResponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CancelResponseClient id={id} />;
}
