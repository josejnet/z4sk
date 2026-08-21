import Link from "next/link";

export function LegalPage({ eyebrow, title, updated = "August 21, 2026", children }:{ eyebrow:string; title:string; updated?:string; children:React.ReactNode }) {
  return <main className="legal-page"><nav><Link href="/">PÁSALO</Link><Link href="/">← Back</Link></nav><article><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="legal-date">Last updated: {updated}</p>{children}</article><footer><span>PÁSALO</span><p>Ask. Answer. Dare.</p></footer></main>;
}
