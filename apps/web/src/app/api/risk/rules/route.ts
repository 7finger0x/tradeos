import { NextResponse } from "next/server";
import { RiskRulesInputSchema, recordAuditEvent } from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data, error } = await supabase
      .from("risk_rules")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rules: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const body = RiskRulesInputSchema.parse(await request.json());

    await supabase
      .from("risk_rules")
      .update({ is_active: false })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("is_active", true);

    const { data, error } = await supabase
      .from("risk_rules")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        max_daily_loss: body.max_daily_loss ?? null,
        max_weekly_loss: body.max_weekly_loss ?? null,
        max_position_risk: body.max_position_risk ?? null,
        max_open_positions: body.max_open_positions ?? null,
        max_trades_per_day: body.max_trades_per_day ?? null,
        max_consecutive_losses: body.max_consecutive_losses ?? null,
        cooldown_after_loss_minutes: body.cooldown_after_loss_minutes ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      tenant_id: tenantId,
      actor_id: userId,
      action: "risk.rules.update",
      resource_type: "risk_rules",
      resource_id: data.id,
      after_state: body as Record<string, unknown>,
    });

    return NextResponse.json({ rules: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
