import { NextResponse } from "next/server";
import { checkRateLimit, hashToken } from "../../db/runtime";

export async function authorizeFounder(request: Request, scope = "founder-dashboard") {
  const rateLimit = await checkRateLimit(request, scope, 12, 15);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many access attempts. Try again later." }, { status: 429, headers: { "retry-after": String(rateLimit.retryAfterSeconds) } });
  const url = new URL(request.url);
  const configured = process.env.FOUNDER_DASHBOARD_KEY?.trim();
  const expected = configured || (url.hostname === "localhost" ? "dev-founder" : "");
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  if (!expected || (url.hostname !== "localhost" && expected.length < 32)) return NextResponse.json({ error: "Set a FOUNDER_DASHBOARD_KEY of at least 32 characters to enable this dashboard." }, { status: 503 });
  if (await hashToken(supplied) !== await hashToken(expected)) return NextResponse.json({ error: "Invalid founder key." }, { status: 403 });
  return null;
}
