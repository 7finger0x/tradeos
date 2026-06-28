import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, tenantId } = session;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const { data, error } = await supabase
      .from("audit_events")
      .select(
        "id, actor_id, action, resource_type, resource_id, before_state, after_state, created_at",
      )
      .eq("tenant_id", tenantId)
      .or(
        "action.ilike.hermes%,and(action.eq.access.denied,resource_type.eq.hermes_operator)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
