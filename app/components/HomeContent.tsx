"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Locale, useLanguage } from "../lib/i18n";
import { Builder } from "./Builder";
import { TopNav } from "./Brand";

const footerCopy: Record<
  Locale,
  {
    legal: string;
    privacy: string;
    terms: string;
    safety: string;
    audit: string;
    source: string;
    close: string;
  }
> = {
  en: { legal: "Legal", privacy: "Privacy", terms: "Terms", safety: "Safety", audit: "Audit", source: "Source", close: "Close" },
  es: { legal: "Información legal", privacy: "Privacidad", terms: "Condiciones", safety: "Seguridad", audit: "Auditoría", source: "Código", close: "Cerrar" },
  it: { legal: "Informazioni legali", privacy: "Privacy", terms: "Termini", safety: "Sicurezza", audit: "Audit", source: "Codice", close: "Chiudi" },
  fr: { legal: "Informations légales", privacy: "Confidentialité", terms: "Conditions", safety: "Sécurité", audit: "Audit", source: "Code", close: "Fermer" },
  de: { legal: "Rechtliches", privacy: "Datenschutz", terms: "Bedingungen", safety: "Sicherheit", audit: "Audit", source: "Code", close: "Schließen" },
  nl: { legal: "Juridisch", privacy: "Privacy", terms: "Voorwaarden", safety: "Veiligheid", audit: "Audit", source: "Code", close: "Sluiten" },
  eo: { legal: "Leĝaj informoj", privacy: "Privateco", terms: "Kondiĉoj", safety: "Sekureco", audit: "Revizio", source: "Kodo", close: "Fermi" },
  pt: { legal: "Informação legal", privacy: "Privacidade", terms: "Termos", safety: "Segurança", audit: "Auditoria", source: "Código", close: "Fechar" },
  zh: { legal: "法律信息", privacy: "隐私", terms: "条款", safety: "安全", audit: "审计", source: "源码", close: "关闭" },
  hi: { legal: "कानूनी जानकारी", privacy: "गोपनीयता", terms: "शर्तें", safety: "सुरक्षा", audit: "ऑडिट", source: "कोड", close: "बंद करें" },
  ja: { legal: "法的情報", privacy: "プライバシー", terms: "利用規約", safety: "安全", audit: "監査", source: "コード", close: "閉じる" },
  tr: { legal: "Yasal", privacy: "Gizlilik", terms: "Koşullar", safety: "Güvenlik", audit: "Denetim", source: "Kod", close: "Kapat" },
  machine: { legal: "LEGAL", privacy: "PRIVACY", terms: "TERMS", safety: "SAFETY", audit: "AUDIT", source: "SOURCE", close: "CLOSE" },
};

const twoChannelCopy: Record<Locale, string> = {
  en: "Link + separate key",
  es: "Enlace + llave separada",
  it: "Link + chiave separata",
  fr: "Lien + clé séparée",
  de: "Link + separater Schlüssel",
  nl: "Link + aparte sleutel",
  eo: "Ligilo + aparta ŝlosilo",
  pt: "Link + chave separada",
  zh: "链接 + 独立密钥",
  hi: "लिंक + अलग कुंजी",
  ja: "リンク＋別経路の鍵",
  tr: "Bağlantı + ayrı anahtar",
  machine: "access.channels=2",
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function HomeContent() {
  const { t, locale } = useLanguage();
  const [builderOpen, setBuilderOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeBuilder = useCallback(() => setBuilderOpen(false), []);
  const openBuilder = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setBuilderOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("create") || params.has("sponsor"))
      queueMicrotask(() => setBuilderOpen(true));
  }, []);

  useEffect(() => {
    if (!builderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusInitialControl = window.requestAnimationFrame(() => {
      (dialog?.querySelector<HTMLElement>("#creator") ||
        dialog?.querySelector<HTMLElement>(focusableSelector))?.focus();
    });
    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeBuilder();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = [
        ...dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ].filter((control) => control.offsetParent !== null);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1) || first;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", keepFocusInside);
    return () => {
      window.cancelAnimationFrame(focusInitialControl);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keepFocusInside);
      window.requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [builderOpen, closeBuilder]);

  return (
    <main className="home-shell">
      <div
        className="home-content"
        inert={builderOpen}
        aria-hidden={builderOpen || undefined}
      >
        <TopNav />
        <section className="hero hero-contained" id="top">
          <div className="eyebrow">✦ &nbsp; {t("eyebrow")}</div>
          <h1>
            {t("hero1")}<br />{t("hero2")}<br /><em>{t("hero3")}</em>
          </h1>
          <p>{t("heroCopy")}</p>
          <button className="hero-start" type="button" onClick={openBuilder}>
            {t("createQuiz")} <span>→</span>
          </button>
          <div className="hero-meta">
            <span><b>01</b> {t("noAccount")}</span>
            <span><b>02</b> {t("privateAnswers")}</span>
            <span><b>03</b> {twoChannelCopy[locale]}</span>
          </div>
        </section>
        <footer className="home-footer">
          <span>Z4SK</span><p>{t("tagline")}</p>
          <nav className="footer-links" aria-label={footerCopy[locale].legal}>
            <a href={`/privacy?lang=${locale}`} target="_top">{footerCopy[locale].privacy}</a>
            <a href={`/terms?lang=${locale}`} target="_top">{footerCopy[locale].terms}</a>
            <a href={`/safety?lang=${locale}`} target="_top">{footerCopy[locale].safety}</a>
            <a href="/audit" target="_top">{footerCopy[locale].audit}</a>
            <a href="https://github.com/josejnet/z4sk" target="_blank" rel="noopener noreferrer">{footerCopy[locale].source} ↗</a>
          </nav>
        </footer>
      </div>
      {builderOpen && (
        <div className="builder-modal" role="dialog" aria-modal="true" aria-labelledby="builder-title">
          <section ref={dialogRef} className="builder-dialog">
            <button className="builder-close" type="button" onClick={closeBuilder} aria-label={footerCopy[locale].close}>×</button>
            <Builder key={locale} onClose={closeBuilder} />
          </section>
        </div>
      )}
    </main>
  );
}
