"use client";

import { useEffect, useState } from "react";
import { type Locale, useLanguage } from "../lib/i18n";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallCopy = { install: string; title: string; ios: string; fallback: string; close: string };
const copy = new Proxy<Record<string, InstallCopy>>({
  en: { install: "Install", title: "Install Z4SK", ios: "Tap Share, then “Add to Home Screen”.", fallback: "Open your browser menu and choose “Install app” or “Add to Home Screen”.", close: "Got it" },
  es: { install: "Instalar", title: "Instalar Z4SK", ios: "Pulsa Compartir y después «Añadir a pantalla de inicio».", fallback: "Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».", close: "Entendido" },
  it: { install: "Installa", title: "Installa Z4SK", ios: "Tocca Condividi, poi “Aggiungi alla schermata Home”.", fallback: "Apri il menu del browser e scegli “Installa app”.", close: "Fatto" },
  fr: { install: "Installer", title: "Installer Z4SK", ios: "Touchez Partager, puis « Sur l’écran d’accueil ».", fallback: "Ouvrez le menu du navigateur et choisissez « Installer l’application ».", close: "Compris" },
  de: { install: "Installieren", title: "Z4SK installieren", ios: "Tippe auf Teilen und dann „Zum Home-Bildschirm“.", fallback: "Öffne das Browsermenü und wähle „App installieren“.", close: "Verstanden" },
}, { get: (target, key) => target[String(key)] || target.en });

export function PwaRegister() {
  const { locale } = useLanguage();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    queueMicrotask(() => { setInstalled(standalone); setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent)); });
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); setInstalled(false); };
    const complete = () => { setInstalled(true); setPrompt(null); setHelpOpen(false); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", complete); };
  }, []);

  async function install() {
    if (!prompt) { setHelpOpen(true); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  if (installed) return null;
  const c = copy[locale as Locale];
  return <><button className="pwa-install" type="button" onClick={install} aria-label={c.title}><span>↓</span>{c.install}</button>{helpOpen&&<div className="pwa-help" role="dialog" aria-modal="true" aria-labelledby="pwa-help-title"><section><button type="button" className="pwa-help-close" onClick={()=>setHelpOpen(false)} aria-label="Close">×</button><span className="pwa-app-icon">4</span><h2 id="pwa-help-title">{c.title}</h2><p>{isIos?c.ios:c.fallback}</p><button type="button" className="primary" onClick={()=>setHelpOpen(false)}>{c.close}</button></section></div>}</>;
}
