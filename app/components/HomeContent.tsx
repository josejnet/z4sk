"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { type Locale, useLanguage } from "../lib/i18n";
import { Builder } from "./Builder";
import { TopNav } from "./Brand";

const paletteOptions = [
  { slug: "original", color: "#ff5a1f", name: "Original · Orange" },
  { slug: "nightlife", color: "#ff3b9d", name: "Night · Pink" },
  { slug: "creator", color: "#7dffbf", name: "Creator · Green" },
  { slug: "ocean", color: "#52c7ff", name: "Ocean · Blue" },
  { slug: "solar", color: "#ff8066", name: "Solar · Coral" },
  { slug: "aurora", color: "#4fe0c0", name: "Aurora · Teal" },
  { slug: "copper", color: "#e8a15d", name: "Forge · Copper" },
] as const;

const palettePickerCopy: Record<Locale, string> = {
  en: "Choose the invitation colour", es: "Elige el color de la invitación", it: "Scegli il colore dell’invito", fr: "Choisissez la couleur de l’invitation", de: "Wähle die Farbe der Einladung", nl: "Kies de kleur van de uitnodiging", eo: "Elektu la koloron de la invito", pt: "Escolha a cor do convite", zh: "选择邀请函颜色", hi: "निमंत्रण का रंग चुनें", ja: "招待状の色を選ぶ", tr: "Davet rengini seç", machine: "INVITATION_COLOR",
};

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
  en: "Temporary · optional extra key",
  es: "Temporal · llave extra opcional",
  it: "Temporaneo · chiave extra facoltativa",
  fr: "Temporaire · clé supplémentaire facultative",
  de: "Temporär · optionaler Zusatzschlüssel",
  nl: "Tijdelijk · optionele extra sleutel",
  eo: "Provizora · nedeviga plia ŝlosilo",
  pt: "Temporário · chave extra opcional",
  zh: "临时有效 · 可选额外密钥",
  hi: "अस्थायी · वैकल्पिक अतिरिक्त कुंजी",
  ja: "期限付き · 任意の追加鍵",
  tr: "Geçici · isteğe bağlı ek anahtar",
  machine: "ttl=user_selected; shared_key=optional",
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
  const [packSlug, setPackSlug] = useState("original");
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
    <main className={`home-shell home-theme-${packSlug}`}>
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
          <div className="home-palette-picker" aria-label={palettePickerCopy[locale]}>
            <span>{palettePickerCopy[locale]}</span>
            <div>
              {paletteOptions.map((palette) => (
                <button
                  key={palette.slug}
                  type="button"
                  className={packSlug === palette.slug ? "active" : ""}
                  style={{ "--palette-color": palette.color } as CSSProperties}
                  aria-label={palette.name}
                  aria-pressed={packSlug === palette.slug}
                  title={palette.name}
                  onClick={() => setPackSlug(palette.slug)}
                />
              ))}
            </div>
          </div>
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
            <Builder key={locale} onClose={closeBuilder} initialPackSlug={packSlug} />
          </section>
        </div>
      )}
    </main>
  );
}
