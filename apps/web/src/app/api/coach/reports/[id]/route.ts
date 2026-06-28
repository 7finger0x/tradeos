import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data: report, error } = await supabase
      .from("coaching_reports")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { data: actions } = await supabase
      .from("coaching_action_items")
      .select("*")
      .eq("report_id", id)
      .order("priority", { ascending: true });

    return NextResponse.json({ report, action_items: actions ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
