import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data, error } = await supabase
      .from("risk_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: cooldowns } = await supabase
      .from("risk_cooldowns")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("active", true)
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      events: data ?? [],
      active_cooldown: cooldowns?.[0] ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
