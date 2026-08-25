import { NextResponse } from "next/server";
import { ensureSchema, getDatabase, purgeExpiredData } from "../../../../db/runtime";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization");
  if (configuredSecret && supplied !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchema();
  const result = await purgeExpiredData(getDatabase(), "vercel-cron");
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
