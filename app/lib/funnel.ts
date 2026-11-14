import type { Locale } from "./i18n";

export type FunnelEvent =
  | "builder_started"
  | "builder_step_1"
  | "builder_step_2"
  | "builder_step_3"
  | "builder_step_4"
  | "builder_created"
  | "invitation_shared"
  | "dashboard_shared"
  | "builder_theme_selected"
  | "recipient_started"
  | "recipient_review"
  | "recipient_submitted";

export function trackFunnel(eventType: FunnelEvent, locale: Locale) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ eventType, locale });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/funnel", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // Fall back to keepalive below when sendBeacon is unavailable or blocked.
  }
  void fetch("/api/funnel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
