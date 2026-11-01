import { NextResponse } from "next/server";

const apiErrorHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
} as const;

export function GET() {
  return NextResponse.json(
    { error: "not_found", message: "Use a documented Z4SK API endpoint." },
    { status: 404, headers: apiErrorHeaders },
  );
}
