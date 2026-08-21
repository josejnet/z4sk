"use client";
import { Builder } from "./Builder";
import { Sponsor, TopNav } from "./Brand";
import { useLanguage } from "../lib/i18n";
import Link from "next/link";
export function HomeContent() {
  const { t, locale } = useLanguage();
  return <main><TopNav /><section className="hero" id="top"><div className="eyebrow">✦ &nbsp; {t("eyebrow")}</div><h1>{t("hero1")}<br />{t("hero2")}<br /><em>{t("hero3")}</em></h1><p>{t("heroCopy")}</p><div className="hero-meta"><span><b>01</b> {t("noAccount")}</span><span><b>02</b> {t("privateAnswers")}</span><span><b>03</b> {t("oneMinute")}</span></div><a className="hero-cta" href="#crear">{t("createQuiz")} ↓</a></section><section className="studio" id="crear"><div className="section-label">{t("createYours")}</div><div className="studio-layout"><Builder key={locale} /><aside className="studio-side"><div className="side-number">01</div><p className="side-quote">“{t("sideQuote")}”</p><div className="privacy-note"><span>◆</span><div><b>{t("onlyEyes")}</b><p>{t("onlyEyesCopy")}</p></div></div><Sponsor /></aside></div></section><section className="how"><span className="section-label">{t("how")}</span><div className="how-grid"><article><b>01</b><h3>{t("ask")}</h3><p>{t("askCopy")}</p></article><article><b>02</b><h3>{t("passIt")}</h3><p>{t("passCopy")}</p></article><article><b>03</b><h3>{t("discover")}</h3><p>{t("discoverCopy")}</p></article></div></section><footer><span>PÁSALO</span><p>{t("tagline")}</p><small>{t("adultFooter")}</small><div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/safety">Safety</Link></div></footer></main>;
}
