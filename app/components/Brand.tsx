"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, type Locale, useLanguage } from "../lib/i18n";

const navCopy:Record<Locale,{home:string;language:string;advertisement:string}>={
  en:{home:"Z4SK, home",language:"Language",advertisement:"Advertisement"},es:{home:"Z4SK, inicio",language:"Idioma",advertisement:"Publicidad"},it:{home:"Z4SK, home",language:"Lingua",advertisement:"Pubblicità"},fr:{home:"Z4SK, accueil",language:"Langue",advertisement:"Publicité"},de:{home:"Z4SK, Startseite",language:"Sprache",advertisement:"Werbung"},nl:{home:"Z4SK, startpagina",language:"Taal",advertisement:"Advertentie"},eo:{home:"Z4SK, hejmpaĝo",language:"Lingvo",advertisement:"Reklamo"},pt:{home:"Z4SK, início",language:"Idioma",advertisement:"Publicidade"},zh:{home:"Z4SK，首页",language:"语言",advertisement:"广告"},hi:{home:"Z4SK, होम",language:"भाषा",advertisement:"विज्ञापन"},ja:{home:"Z4SK、ホーム",language:"言語",advertisement:"広告"},tr:{home:"Z4SK, ana sayfa",language:"Dil",advertisement:"Reklam"},machine:{home:"Z4SK::ROOT",language:"LOCALE",advertisement:"ADVERTISEMENT"}
};

export function Brand() {
  const { locale }=useLanguage();
  // A hard navigation keeps the home escape hatch working if the client router fails.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <a className="brand" href="/" target="_top" aria-label={navCopy[locale].home}><span className="brand-mark" aria-hidden="true" /><span>Z4SK</span></a>;
}

export function TopNav({ minimal = false }: { minimal?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  return <nav className={`nav ${minimal ? "nav-minimal" : ""}`}><Brand /><div className="nav-actions"><label className="language-picker"><span className="sr-only">{navCopy[locale].language}</span><select value={locale} aria-label={navCopy[locale].language} onChange={(event) => setLocale(event.target.value as typeof locale)}>{LOCALES.map((item) => <option value={item.id} key={item.id}>{item.short}</option>)}</select></label><span className="privacy-pill"><i /> {t("privacy")}</span></div></nav>;
}

type SponsorPlacement = "invitation" | "completion" | "dashboard";
type SponsorConfig = {enabled:boolean;label?:string;headline?:string;ctaLabel?:string;destinationUrl?:string;campaignVersion?:string};

export function Sponsor({ compact = false, placement }: { compact?: boolean; placement: SponsorPlacement }) {
  const { locale } = useLanguage();
  const [config, setConfig] = useState<SponsorConfig|null>(null);
  const sponsorRef = useRef<HTMLElement>(null);
  const impressionRecorded = useRef(false);
  useEffect(() => { let active=true; void fetch("/api/ads",{credentials:"omit"}).then((response)=>response.json()).then((result)=>{if(active)setConfig(result)}).catch(()=>{if(active)setConfig({enabled:false})}); return()=>{active=false}; }, []);
  useEffect(()=>{
    const node=sponsorRef.current;
    if(!node||!config?.enabled||!config.campaignVersion||impressionRecorded.current)return;
    let timer=0;
    const observer=new IntersectionObserver(([entry])=>{
      window.clearTimeout(timer);
      if(!entry?.isIntersecting||entry.intersectionRatio<0.5)return;
      timer=window.setTimeout(()=>{
        const sessionKey=`z4sk:sponsor:${config.campaignVersion}:${placement}`;
        try{if(sessionStorage.getItem(sessionKey))return;sessionStorage.setItem(sessionKey,"1");}catch{/* Aggregate measurement still works when session storage is unavailable. */}
        impressionRecorded.current=true;
        void recordSponsorEvent("impression",placement,locale,config.campaignVersion!);
        observer.disconnect();
      },1000);
    },{threshold:[0.5]});
    observer.observe(node);
    return()=>{window.clearTimeout(timer);observer.disconnect()};
  },[config,locale,placement]);
  if (!config?.enabled || !config.headline || !config.ctaLabel || !config.destinationUrl || !config.campaignVersion) return null;
  return <aside ref={sponsorRef} className={`sponsor sponsor-live ${compact ? "sponsor-compact" : ""}`} aria-label={navCopy[locale].advertisement}><span>{config.label||navCopy[locale].advertisement}</span><p>{config.headline}</p><a href={config.destinationUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" onClick={()=>void recordSponsorClick(placement,locale,config.campaignVersion!)}>{config.ctaLabel} <span aria-hidden="true">↗</span></a></aside>;
}

async function recordSponsorClick(placement:SponsorPlacement,locale:Locale,campaignVersion:string){
  const sessionKey=`z4sk:sponsor-click:${campaignVersion}:${placement}`;
  try{if(sessionStorage.getItem(sessionKey))return;sessionStorage.setItem(sessionKey,"1");}catch{/* Count the click when session storage is unavailable. */}
  await recordSponsorEvent("click",placement,locale,campaignVersion);
}
async function recordSponsorEvent(eventType:"impression"|"click",placement:SponsorPlacement,locale:Locale,campaignVersion:string){
  try{await fetch("/api/ads",{method:"POST",credentials:"omit",keepalive:true,headers:{"content-type":"application/json"},body:JSON.stringify({eventType,placement,locale,campaignVersion})});}catch{/* Advertising must never block the product flow. */}
}
