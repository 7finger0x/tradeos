import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import {
  evaluateUserRisk,
  loadActiveRiskRules,
  recordRiskStateChange,
  startCooldownIfNeeded,
} from "@/lib/risk/evaluate-user-risk";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { evaluation, metrics } = await evaluateUserRisk(supabase, tenantId, userId);

    const { data: lastEvent } = await supabase
      .from("risk_events")
      .select("risk_state")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await recordRiskStateChange(
      supabase,
      tenantId,
      userId,
      evaluation,
      metrics,
      lastEvent?.risk_state ?? null,
    );

    const rules = await loadActiveRiskRules(supabase, tenantId, userId);
    if (evaluation.risk_state === "lockout") {
      await startCooldownIfNeeded(
        supabase,
        tenantId,
        userId,
        evaluation,
        rules?.cooldown_after_loss_minutes,
      );
    }

    return NextResponse.json({
      evaluation,
      metrics,
      rules,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
