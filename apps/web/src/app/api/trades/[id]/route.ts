import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import { resolveScreenshotSignedUrls } from "@/lib/screenshots/signed-urls";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data, error } = await supabase
      .from("trades")
      .select("*, setups(name, tags)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const paths = (data.screenshot_urls ?? []) as string[];
    const screenshots = await resolveScreenshotSignedUrls(supabase, paths);

    return NextResponse.json({ trade: data, screenshots });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
