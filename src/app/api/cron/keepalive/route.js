import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Vercel cron istekleri GET ile gelir; CRON_SECRET tanımlıysa Vercel
 * isteğe otomatik olarak "Authorization: Bearer <CRON_SECRET>" ekler.
 */
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("feeds")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[cron/keepalive] DB ping error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    feeds: count,
    pingedAt: new Date().toISOString(),
  });
}
