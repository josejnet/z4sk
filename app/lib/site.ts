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
  description: "Create private questions, share one link, and receive encrypted answers in your secret dashboard.",
  socialDescription: "Ask what matters. Share one private link. Receive encrypted answers in your secret dashboard.",
  themeColor: "#ff5a1f",
  backgroundColor: "#0b0b0b",
} as const;
