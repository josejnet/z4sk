import Link from "next/link";

export function LegalPage({ eyebrow, title, updated = "August 21, 2026", children }:{ eyebrow:string; title:string; updated?:string; children:React.ReactNode }) {
  return <main className="legal-page"><nav><Link href="/">Z4SK</Link><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/safety">Safety</Link><Link href="/">← Back</Link></div></nav><article><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="legal-date">Last updated: {updated} · Private beta</p>{children}</article><footer><span>Z4SK</span><p>Ask. Answer. Dare.</p></footer></main>;
}
