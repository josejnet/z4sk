/* eslint-disable @next/next/no-html-link-for-pages -- legal escape links must bypass the failing client router */
export function LegalPage({ eyebrow, title, updated = "August 21, 2026", children }:{ eyebrow:string; title:string; updated?:string; children:React.ReactNode }) {
  return <main className="legal-page"><nav><a href="/" target="_top">Z4SK</a><div><a href="/privacy" target="_top">Privacy</a><a href="/terms" target="_top">Terms</a><a href="/safety" target="_top">Safety</a><a href="/" target="_top">← Back</a></div></nav><article><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="legal-date">Last updated: {updated} · Private beta</p>{children}</article><footer><span>Z4SK</span><p>Ask. Answer. Dare.</p></footer></main>;
}
