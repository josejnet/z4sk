"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- legal escape links must bypass the failing client router */
import { LOCALES,useLanguage } from "../lib/i18n";
import { LEGAL_COPY,type LegalKind } from "../lib/legal-copy";

export function LegalPage({ kind, updated = "August 21, 2026", children }:{ kind:LegalKind; updated?:string; children:React.ReactNode }) {
  const {locale,setLocale}=useLanguage();const c=LEGAL_COPY[locale];const doc=c.docs[kind];
  return <main className="legal-page"><nav><a href="/" target="_top">Z4SK</a><div><label className="language-picker"><span className="sr-only">{c.language}</span><select value={locale} aria-label={c.language} onChange={(event)=>setLocale(event.target.value as typeof locale)}>{LOCALES.map((item)=><option value={item.id} key={item.id}>{item.short}</option>)}</select></label><a href="/privacy" target="_top">{c.privacy}</a><a href="/terms" target="_top">{c.terms}</a><a href="/safety" target="_top">{c.safety}</a><a href="/" target="_top">← {c.back}</a></div></nav><article><span className="eyebrow">{doc.eyebrow}</span><h1>{doc.title}</h1><p className="legal-date">{c.updated}: {updated} · {c.beta}</p>{locale==="en"?children:<><div className="legal-callout"><p>{doc.intro}</p></div><div className="legal-table">{doc.points.map(([heading,body])=><div key={heading}><b>{heading}</b><span>{body}</span></div>)}</div>{kind==="privacy"&&<p><a className="proof-json" href="/api/privacy-proof" target="_blank" rel="noopener noreferrer">JSON · LIVE EVIDENCE →</a></p>}<details><summary>{c.fullEnglish}</summary>{children}</details></>}</article><footer><span>Z4SK</span><p>{c.tagline}</p></footer></main>;
}
