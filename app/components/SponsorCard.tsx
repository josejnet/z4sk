"use client";

import { useEffect, useState } from "react";

type SponsorCardData = { slug: string; title: string; description: string; ctaText: string; badgeText: string; accentColor: string };

export function SponsorCard({ lang = "en", intensity = "all" }: { lang?: string; intensity?: string }) {
  const [card, setCard] = useState<SponsorCardData | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sponsors/card?lang=${encodeURIComponent(lang)}&intensity=${encodeURIComponent(intensity)}`, { cache: "no-store" }).then((response) => response.json() as Promise<{ card?: SponsorCardData | null }>).then((result) => { if (!cancelled) setCard(result.card || null); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [lang, intensity]);
  if (!card) return null;
  return <aside className="sponsor-card" data-accent={card.accentColor} aria-label={card.badgeText || "Sponsor"}><span className="sponsor-card-badge">{card.badgeText || "Patrocinio"}</span><strong>{card.title}</strong><p>{card.description}</p><a href={`/go/${encodeURIComponent(card.slug)}`} target="_blank" rel="noopener noreferrer sponsored">{card.ctaText} ↗</a></aside>;
}
