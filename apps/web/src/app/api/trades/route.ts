import { NextResponse } from "next/server";
import {
  CreateTradeInputSchema,
  checkProposedTradeRisk,
  normalizeTradeInput,
  recordAuditEvent,
  recordDeniedAccess,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import { evaluateUserRisk, loadActiveRiskRules } from "@/lib/risk/evaluate-user-risk";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const { data, error } = await supabase
      .from("trades")
      .select("*, setups(name)")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("entry_time", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trades: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const body = CreateTradeInputSchema.parse(await request.json());
    const normalized = normalizeTradeInput(body);

    const { evaluation } = await evaluateUserRisk(supabase, tenantId, userId);
    const rules = await loadActiveRiskRules(supabase, tenantId, userId);
    const riskCheck = checkProposedTradeRisk(
      evaluation,
      normalized.risk_amount,
      rules?.max_position_risk ?? null,
    );

    if (!riskCheck.allowed) {
      if (evaluation.risk_state === "lockout") {
        await recordDeniedAccess(supabase, {
          tenant_id: tenantId,
          actor_id: userId,
          action: "access.denied",
          resource_type: "risk_lockout",
          reason: "Trade blocked by risk lockout",
          metadata: {
            risk_state: evaluation.risk_state,
            warnings: riskCheck.warnings,
          },
        });
      }

      return NextResponse.json(
        {
          error: "Trade blocked by risk manager",
          risk_state: evaluation.risk_state,
          ui_label: evaluation.ui_label,
          warnings: riskCheck.warnings,
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("trades")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        setup_id: normalized.setup_id ?? null,
        symbol: normalized.symbol,
        asset_class: normalized.asset_class,
        direction: normalized.direction,
        entry_time: normalized.entry_time,
        exit_time: normalized.exit_time ?? null,
        entry_price: normalized.entry_price,
        exit_price: normalized.exit_price ?? null,
        quantity: normalized.quantity,
        fees: normalized.fees,
        gross_pnl: normalized.gross_pnl ?? null,
        net_pnl: normalized.net_pnl,
        r_multiple: normalized.r_multiple,
        stop_loss: normalized.stop_loss ?? null,
        target_price: normalized.target_price ?? null,
        risk_amount: normalized.risk_amount ?? null,
        notes: normalized.notes ?? null,
        emotion: normalized.emotion ?? null,
        conviction: normalized.conviction ?? null,
        discipline_score: normalized.discipline_score ?? null,
        mistake_tags: normalized.mistake_tags,
        screenshot_urls: normalized.screenshot_urls,
        broker: normalized.broker,
        broker_trade_id: normalized.broker_trade_id ?? null,
        trade_fingerprint: normalized.trade_fingerprint,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Duplicate trade detected" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditEvent(supabase, {
      tenant_id: tenantId,
      actor_id: userId,
      action: "trade.create",
      resource_type: "trade",
      resource_id: data.id,
      after_state: { symbol: data.symbol, net_pnl: data.net_pnl },
    });

    return NextResponse.json(
      {
        trade: data,
        risk_warnings: riskCheck.warnings,
        risk_state: evaluation.ui_label,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
