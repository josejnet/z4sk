"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../lib/i18n";
import { Builder } from "./Builder";
import { TopNav } from "./Brand";

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
    <footer className="home-footer"><span>Z4SK</span><p>{t("tagline")}</p><nav className="footer-links" aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/safety">Safety</a></nav></footer>
    {builderOpen && <div className="builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-title">
      <section className="builder-dialog">
        <button className="builder-close" type="button" onClick={() => setBuilderOpen(false)} aria-label="Close">×</button>
        <Builder key={locale} onClose={() => setBuilderOpen(false)} />
      </section>
    </div>}
  </main>;
}
