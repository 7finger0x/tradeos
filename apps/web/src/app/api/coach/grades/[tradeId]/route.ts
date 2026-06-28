import { NextResponse } from "next/server";
import { gradeTrade } from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
) {
  try {
    const { tradeId } = await context.params;
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data, error } = await supabase
      .from("trade_grades")
      .select("*")
      .eq("trade_id", tradeId)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ grade: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ tradeId: string }> },
) {
  try {
    const { tradeId } = await context.params;
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data: trade, error } = await supabase
      .from("trades")
      .select(
        "id, setup_id, exit_time, exit_price, net_pnl, r_multiple, stop_loss, risk_amount, target_price, notes, emotion, conviction, discipline_score, mistake_tags",
      )
      .eq("id", tradeId)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    if (error || !trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const grade = gradeTrade({
      setup_id: trade.setup_id,
      exit_time: trade.exit_time,
      exit_price: trade.exit_price !== null ? Number(trade.exit_price) : null,
      net_pnl: trade.net_pnl !== null ? Number(trade.net_pnl) : null,
      r_multiple: trade.r_multiple !== null ? Number(trade.r_multiple) : null,
      stop_loss: trade.stop_loss !== null ? Number(trade.stop_loss) : null,
      risk_amount: trade.risk_amount !== null ? Number(trade.risk_amount) : null,
      target_price: trade.target_price !== null ? Number(trade.target_price) : null,
      notes: trade.notes,
      emotion: trade.emotion,
      conviction: trade.conviction,
      discipline_score: trade.discipline_score,
      mistake_tags: trade.mistake_tags ?? [],
    });

    const { data: saved, error: saveError } = await supabase
      .from("trade_grades")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          trade_id: trade.id,
          overall_grade: grade.overall_grade,
          setup_quality: grade.setup_quality,
          execution_quality: grade.execution_quality,
          risk_management: grade.risk_management,
          discipline: grade.discipline,
          emotional_control: grade.emotional_control,
          data_completeness: grade.data_completeness,
          feedback_text: grade.feedback_text,
          evidence: grade.evidence,
        },
        { onConflict: "trade_id" },
      )
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ grade: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
