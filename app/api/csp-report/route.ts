import { getDatabase } from "../../../db/runtime";

const MAX_BODY_BYTES = 32_768;
const MAX_REPORTS_PER_REQUEST = 10;
const VALID_DIRECTIVE = /^[a-z0-9-]{1,64}$/;
const PUBLIC_ROUTES = new Set(["/", "/audit", "/founder", "/privacy", "/safety", "/terms"]);

type ReportRecord = Record<string, unknown>;
type Aggregate = { directive: string; routeGroup: string; disposition: string; count: number };

function record(value: unknown): ReportRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ReportRecord : null;
}

function reportsFrom(payload: unknown) {
  const candidates = Array.isArray(payload) ? payload : [payload];
  return candidates.slice(0, MAX_REPORTS_PER_REQUEST).map((candidate) => {
    const outer = record(candidate);
    if (!outer) return null;
    return record(outer["csp-report"]) || record(outer.body) || outer;
  }).filter((candidate): candidate is ReportRecord => Boolean(candidate));
}

function text(report: ReportRecord, modern: string, legacy: string) {
  const value = report[modern] ?? report[legacy];
  return typeof value === "string" ? value : "";
}

function directive(report: ReportRecord) {
  const value = text(report, "effectiveDirective", "effective-directive").trim().toLowerCase();
  return VALID_DIRECTIVE.test(value) ? value : "unknown";
}

function disposition(report: ReportRecord) {
  const value = text(report, "disposition", "disposition").trim().toLowerCase();
  return value === "enforce" || value === "report" ? value : "unknown";
}

function routeGroup(report: ReportRecord) {
  const documentUrl = text(report, "documentURL", "document-uri");
  try {
    const pathname = new URL(documentUrl, "https://invalid.local").pathname;
    if (PUBLIC_ROUTES.has(pathname)) return pathname;
    if (/^\/g\/[^/]+\/?$/.test(pathname)) return "/g/:id";
    if (/^\/p\/[^/]+\/?$/.test(pathname)) return "/p/:id";
    if (/^\/cancel\/[^/]+\/?$/.test(pathname)) return "/cancel/:id";
    if (pathname.startsWith("/api/")) return "/api/:route";
    return "/other";
  } catch {
    return "/unknown";
  }
}

function aggregateReports(payload: unknown) {
  const totals = new Map<string, Aggregate>();
  for (const report of reportsFrom(payload)) {
    const item = { directive: directive(report), routeGroup: routeGroup(report), disposition: disposition(report), count: 1 };
    const key = `${item.directive}\u0000${item.routeGroup}\u0000${item.disposition}`;
    const existing = totals.get(key);
    if (existing) existing.count += 1;
    else totals.set(key, item);
  }
  return [...totals.values()];
}

function emptyResponse() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return emptyResponse();

  let raw = "";
  try {
    raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return emptyResponse();
    const aggregates = aggregateReports(JSON.parse(raw));
    if (!aggregates.length) return emptyResponse();
    const day = new Date().toISOString().slice(0, 10);
    const db = getDatabase();
    await db.batch(aggregates.map((item) => db.prepare(`INSERT INTO csp_violation_daily (day, directive, route_group, disposition, event_count) VALUES (?, ?, ?, ?, ?) ON CONFLICT(day, directive, route_group, disposition) DO UPDATE SET event_count = csp_violation_daily.event_count + EXCLUDED.event_count`).bind(day, item.directive, item.routeGroup, item.disposition, item.count)));
  } catch {
    // Reports are attacker-controlled. Do not log their payload, URL, source or parse error.
  }
  return emptyResponse();
}
