"use client";

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

export function Sponsor(_props: { compact?: boolean; placement: SponsorPlacement }) {
  return null;
}
