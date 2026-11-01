import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import "./product.css";
import "./extras.css";
import "./features.css";
import "./modal.css";
import "./wizard.css";
import "./logo.css";
import "./share.css";
import "./ads.css";
import "./csp-progress.css";
import { LanguageProvider } from "./lib/i18n";
import { site } from "./lib/site";
import { PwaRegister } from "./components/PwaRegister";
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: site.title,
  description: site.description,
  category: "social",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.socialDescription,
    url: "/",
    images: [{ url: "/og.png", width: 1732, height: 908, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.socialDescription,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: site.themeColor,
  colorScheme: "dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { await connection(); return <html lang="en-US"><head><link rel="shortcut icon" href="/favicon.ico" /></head><body className={`${geist.variable} ${mono.variable}`}><LanguageProvider><PwaRegister />{children}</LanguageProvider></body></html>; }
