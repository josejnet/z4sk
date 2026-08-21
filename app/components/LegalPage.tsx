"use client";
import { useEffect } from "react";
import { LOCALES,useLanguage } from "../lib/i18n";
import { LEGAL_COPY,type LegalKind } from "../lib/legal-copy";

const DATE_LOCALES={en:"en-US",es:"es-ES",it:"it-IT",fr:"fr-FR",de:"de-DE",nl:"nl-NL",eo:"eo",pt:"pt-PT",zh:"zh-CN",hi:"hi-IN",ja:"ja-JP",tr:"tr-TR",machine:"en-CA"} as const;

export function LegalPage({ kind, updated = "2026-08-22", children }:{ kind:LegalKind; updated?:string; children:React.ReactNode }) {
  const {locale,setLocale}=useLanguage();const c=LEGAL_COPY[locale];const doc=c.docs[kind];
  const displayDate=locale==="machine"?updated:new Intl.DateTimeFormat(DATE_LOCALES[locale],{dateStyle:"long",timeZone:"UTC"}).format(new Date(`${updated}T12:00:00Z`));
  useEffect(()=>{const timer=window.setTimeout(()=>{document.title=`${doc.title} · Z4SK`;document.querySelector('meta[name="description"]')?.setAttribute("content",doc.intro);},0);return()=>window.clearTimeout(timer);},[doc]);
  return <main className="legal-page"><nav><a href={`/?lang=${locale}`} target="_top">Z4SK</a><div><label className="language-picker"><span className="sr-only">{c.language}</span><select value={locale} aria-label={c.language} onChange={(event)=>setLocale(event.target.value as typeof locale)}>{LOCALES.map((item)=><option value={item.id} key={item.id}>{item.short}</option>)}</select></label><a href={`/privacy?lang=${locale}`} target="_top">{c.privacy}</a><a href={`/terms?lang=${locale}`} target="_top">{c.terms}</a><a href={`/safety?lang=${locale}`} target="_top">{c.safety}</a><a href={`/?lang=${locale}`} target="_top">← {c.back}</a></div></nav><article><span className="eyebrow">{doc.eyebrow}</span><h1>{doc.title}</h1><p className="legal-date">{c.updated}: {displayDate} · {c.beta}</p>{locale==="en"?children:<><div className="legal-callout"><p>{doc.intro}</p></div><div className="legal-table">{doc.points.map(([heading,body])=><div key={heading}><b>{heading}</b><span>{body}</span></div>)}</div>{kind==="privacy"&&<p><a className="proof-json" href="/api/privacy-proof" target="_blank" rel="noopener noreferrer">JSON · {doc.eyebrow} →</a></p>}<details><summary>{c.fullEnglish}</summary>{children}</details></>}</article><footer><span>Z4SK</span><p>{c.tagline}</p></footer></main>;
}
