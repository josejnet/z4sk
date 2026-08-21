"use client";

import { useEffect, useState } from "react";
import { type Locale, useLanguage } from "../lib/i18n";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallCopy = { install: string; title: string; ios: string; fallback: string; close: string; dismiss: string };
const copy:Record<Locale,InstallCopy> = {
  en: { install:"Install",title:"Install Z4SK",ios:"Tap Share, then “Add to Home Screen”.",fallback:"Open your browser menu and choose “Install app” or “Add to Home Screen”.",close:"Got it",dismiss:"Close" },
  es: { install:"Instalar",title:"Instalar Z4SK",ios:"Pulsa Compartir y después «Añadir a pantalla de inicio».",fallback:"Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».",close:"Entendido",dismiss:"Cerrar" },
  it: { install:"Installa",title:"Installa Z4SK",ios:"Tocca Condividi, poi “Aggiungi alla schermata Home”.",fallback:"Apri il menu del browser e scegli “Installa app”.",close:"Fatto",dismiss:"Chiudi" },
  fr: { install:"Installer",title:"Installer Z4SK",ios:"Touchez Partager, puis « Sur l’écran d’accueil ».",fallback:"Ouvrez le menu du navigateur et choisissez « Installer l’application ».",close:"Compris",dismiss:"Fermer" },
  de: { install:"Installieren",title:"Z4SK installieren",ios:"Tippe auf Teilen und dann „Zum Home-Bildschirm“.",fallback:"Öffne das Browsermenü und wähle „App installieren“.",close:"Verstanden",dismiss:"Schließen" },
  nl: { install:"Installeren",title:"Z4SK installeren",ios:"Tik op Delen en daarna op ‘Zet op beginscherm’.",fallback:"Open het browsermenu en kies ‘App installeren’ of ‘Zet op beginscherm’.",close:"Begrepen",dismiss:"Sluiten" },
  eo: { install:"Instali",title:"Instali Z4SK",ios:"Tuŝu Kunhavigi kaj poste «Aldoni al la hejma ekrano».",fallback:"Malfermu la menuon de la retumilo kaj elektu «Instali aplikaĵon» aŭ «Aldoni al la hejma ekrano».",close:"Komprenite",dismiss:"Fermi" },
  pt: { install:"Instalar",title:"Instalar o Z4SK",ios:"Toca em Partilhar e depois em «Adicionar ao ecrã principal».",fallback:"Abre o menu do navegador e escolhe «Instalar aplicação» ou «Adicionar ao ecrã principal».",close:"Entendido",dismiss:"Fechar" },
  zh: { install:"安装",title:"安装 Z4SK",ios:"点击“分享”，然后选择“添加到主屏幕”。",fallback:"打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。",close:"知道了",dismiss:"关闭" },
  hi: { install:"इंस्टॉल",title:"Z4SK इंस्टॉल करें",ios:"शेयर दबाएँ, फिर “होम स्क्रीन पर जोड़ें” चुनें।",fallback:"ब्राउज़र मेनू खोलें और “ऐप इंस्टॉल करें” या “होम स्क्रीन पर जोड़ें” चुनें।",close:"समझ गया",dismiss:"बंद करें" },
  ja: { install:"インストール",title:"Z4SKをインストール",ios:"共有をタップし、「ホーム画面に追加」を選びます。",fallback:"ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。",close:"了解",dismiss:"閉じる" },
  tr: { install:"Yükle",title:"Z4SK'i yükle",ios:"Paylaş'a, ardından “Ana Ekrana Ekle”ye dokun.",fallback:"Tarayıcı menüsünü açıp “Uygulamayı yükle” veya “Ana Ekrana Ekle”yi seç.",close:"Anladım",dismiss:"Kapat" },
  machine: { install:"INSTALL",title:"INSTALL Z4SK",ios:"INVOKE share_sheet; SELECT add_to_home_screen",fallback:"OPEN browser.menu; SELECT install_app|add_to_home_screen",close:"ACK",dismiss:"CLOSE" }
};

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
  const c = copy[locale];
  return <><button className="pwa-install" type="button" onClick={install} aria-label={c.title}><span>↓</span>{c.install}</button>{helpOpen&&<div className="pwa-help" role="dialog" aria-modal="true" aria-labelledby="pwa-help-title"><section><button type="button" className="pwa-help-close" onClick={()=>setHelpOpen(false)} aria-label={c.dismiss}>×</button><span className="pwa-app-icon" aria-hidden="true" /><h2 id="pwa-help-title">{c.title}</h2><p>{isIos?c.ios:c.fallback}</p><button type="button" className="primary" onClick={()=>setHelpOpen(false)}>{c.close}</button></section></div>}</>;
}
