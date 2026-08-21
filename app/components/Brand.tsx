import Link from "next/link";
import { LOCALES, useLanguage } from "../lib/i18n";

export function Brand() {
  return <Link className="brand" href="/" aria-label="Z4SK, home"><span className="brand-mark">4</span><span>Z4SK</span></Link>;
}

export function TopNav({ minimal = false }: { minimal?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  return <nav className={`nav ${minimal ? "nav-minimal" : ""}`}><Brand /><div className="nav-actions"><label className="language-picker"><span className="sr-only">Language</span><select value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>{LOCALES.map((item) => <option value={item.id} key={item.id}>{item.short}</option>)}</select></label><span className="privacy-pill"><i /> {t("privacy")}</span></div></nav>;
}

export function Sponsor({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return <aside className={`sponsor ${compact ? "sponsor-compact" : ""}`} aria-label="Advertisement"><span>{t("sponsorSpace")}</span><p>{t("sponsorCopy")}</p><Link href="/?sponsor=1#crear">{t("advertise")} →</Link></aside>;
}
