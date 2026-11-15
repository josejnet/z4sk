import { NextResponse } from "next/server";
import { getDatabase, ensureSchema } from "../../../db/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await ensureSchema();
    const { slug } = await params;
    const row = await getDatabase().prepare(`SELECT affiliate_url FROM affiliate_cards WHERE slug=? AND active=1`).bind(slug).first<{ affiliate_url: string }>();
    if (!row?.affiliate_url) return NextResponse.redirect(new URL("/", request.url), { status: 302 });
    await getDatabase().prepare(`UPDATE affiliate_cards SET clicks_count=clicks_count+1 WHERE slug=? AND active=1`).bind(slug).run();
    return NextResponse.redirect(row.affiliate_url, { status: 302, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("affiliate-redirect", error);
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }
}
