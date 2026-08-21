"use client";

import { useEffect, useState } from "react";
import { type Locale, useLanguage } from "../lib/i18n";
import { Builder } from "./Builder";
import { TopNav } from "./Brand";

const footerCopy:Record<Locale,{legal:string;privacy:string;terms:string;safety:string;close:string}>={
  en:{legal:"Legal",privacy:"Privacy",terms:"Terms",safety:"Safety",close:"Close"},es:{legal:"Información legal",privacy:"Privacidad",terms:"Condiciones",safety:"Seguridad",close:"Cerrar"},it:{legal:"Informazioni legali",privacy:"Privacy",terms:"Termini",safety:"Sicurezza",close:"Chiudi"},fr:{legal:"Informations légales",privacy:"Confidentialité",terms:"Conditions",safety:"Sécurité",close:"Fermer"},de:{legal:"Rechtliches",privacy:"Datenschutz",terms:"Bedingungen",safety:"Sicherheit",close:"Schließen"},nl:{legal:"Juridisch",privacy:"Privacy",terms:"Voorwaarden",safety:"Veiligheid",close:"Sluiten"},eo:{legal:"Leĝaj informoj",privacy:"Privateco",terms:"Kondiĉoj",safety:"Sekureco",close:"Fermi"},pt:{legal:"Informação legal",privacy:"Privacidade",terms:"Termos",safety:"Segurança",close:"Fechar"},zh:{legal:"法律信息",privacy:"隐私",terms:"条款",safety:"安全",close:"关闭"},hi:{legal:"कानूनी जानकारी",privacy:"गोपनीयता",terms:"शर्तें",safety:"सुरक्षा",close:"बंद करें"},ja:{legal:"法的情報",privacy:"プライバシー",terms:"利用規約",safety:"安全",close:"閉じる"},tr:{legal:"Yasal",privacy:"Gizlilik",terms:"Koşullar",safety:"Güvenlik",close:"Kapat"},machine:{legal:"LEGAL",privacy:"PRIVACY",terms:"TERMS",safety:"SAFETY",close:"CLOSE"}
};

export function HomeContent() {
  const { t, locale } = useLanguage();
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("create") || params.has("sponsor")) queueMicrotask(() => setBuilderOpen(true));
  }, []);

  useEffect(() => {
    if (!builderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setBuilderOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [builderOpen]);

  return <main className="home-shell">
    <TopNav />
    <section className="hero hero-contained" id="top">
      <div className="eyebrow">✦ &nbsp; {t("eyebrow")}</div>
      <h1>{t("hero1")}<br />{t("hero2")}<br /><em>{t("hero3")}</em></h1>
      <p>{t("heroCopy")}</p>
      <button className="hero-start" type="button" onClick={() => setBuilderOpen(true)}>{t("createQuiz")} <span>→</span></button>
      <div className="hero-meta"><span><b>01</b> {t("noAccount")}</span><span><b>02</b> {t("privateAnswers")}</span><span><b>03</b> {t("oneMinute")}</span></div>
    </section>
    <footer className="home-footer"><span>Z4SK</span><p>{t("tagline")}</p><nav className="footer-links" aria-label={footerCopy[locale].legal}><a href="/privacy" target="_top">{footerCopy[locale].privacy}</a><a href="/terms" target="_top">{footerCopy[locale].terms}</a><a href="/safety" target="_top">{footerCopy[locale].safety}</a></nav></footer>
    {builderOpen && <div className="builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-title">
      <section className="builder-dialog">
        <button className="builder-close" type="button" onClick={() => setBuilderOpen(false)} aria-label={footerCopy[locale].close}>×</button>
        <Builder key={locale} onClose={() => setBuilderOpen(false)} />
      </section>
    </div>}
  </main>;
}
