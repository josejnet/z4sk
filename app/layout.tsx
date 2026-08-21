import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./product.css";
import "./extras.css";
import "./features.css";
import "./modal.css";
import "./wizard.css";
import { LanguageProvider } from "./lib/i18n";
import { PwaRegister } from "./components/PwaRegister";
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return { metadataBase: new URL(origin), manifest: "/manifest.webmanifest", applicationName: "Z4SK", title: "Z4SK — Ask. Answer. Dare.", description: "Create questions, share a link, and receive answers privately.", openGraph: { title: "Z4SK — Ask. Answer. Dare.", description: "Create a private questionnaire and share it on WhatsApp.", images: [{ url: `${origin}/og.png`, width: 1732, height: 908, alt: "Z4SK — Ask. Answer. Dare." }] }, twitter: { card: "summary_large_image", title: "Z4SK — Ask. Answer. Dare.", description: "Create a private questionnaire and share it on WhatsApp.", images: [`${origin}/og.png`] } };
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-US"><body className={`${geist.variable} ${mono.variable}`}><LanguageProvider><PwaRegister />{children}</LanguageProvider></body></html>; }
