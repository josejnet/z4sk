const FALLBACK_SITE_URL = "https://z4sk.vercel.app";

function resolveSiteUrl() {
  const configuredUrl = process.env.SITE_URL?.trim() || FALLBACK_SITE_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const site = {
  name: "Z4SK",
  domain: "z4sk.com",
  url: resolveSiteUrl(),
  title: "Z4SK — Ask. Answer. Dare.",
  description: "Create end-to-end encrypted questions protected by a private link and a separately shared reusable key.",
  socialDescription: "Ask what matters. Share an encrypted invitation through two separate channels. Receive encrypted answers privately.",
  themeColor: "#ff5a1f",
  backgroundColor: "#0b0b0b",
} as const;
