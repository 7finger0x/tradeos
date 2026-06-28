import { NextResponse } from "next/server";
import { checkProposedTradeRisk } from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import { evaluateUserRisk, loadActiveRiskRules } from "@/lib/risk/evaluate-user-risk";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const body = (await request.json()) as { risk_amount?: number };
    const { evaluation } = await evaluateUserRisk(supabase, tenantId, userId);
    const rules = await loadActiveRiskRules(supabase, tenantId, userId);

    const check = checkProposedTradeRisk(
      evaluation,
      body.risk_amount,
      rules?.max_position_risk ?? null,
    );

    return NextResponse.json({
      evaluation,
      ...check,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
