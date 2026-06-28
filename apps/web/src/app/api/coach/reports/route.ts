import { NextResponse } from "next/server";
import {
  analyzeMistakeCosts,
  computeBehavioralScore,
  computeTradeAnalytics,
  detectEmotionalTriggers,
  generateCoachingReport,
  gradeTrade,
  startOfWeek,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const weekStart = startOfWeek(new Date());
    const periodStart = weekStart.toISOString().slice(0, 10);

    const { data: latest } = await supabase
      .from("coaching_reports")
      .select("id, report_type, period_start, period_end, next_week_focus, confidence_score, created_at")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("period_start", { ascending: false })
      .limit(10);

    const { data: current } = await supabase
      .from("coaching_reports")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("report_type", "weekly")
      .eq("period_start", periodStart)
      .maybeSingle();

    return NextResponse.json({
      current_week: current,
      history: latest ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const now = new Date();
    const periodStart = startOfWeek(now);
    const periodEnd = now;
    const periodStartStr = periodStart.toISOString().slice(0, 10);
    const periodEndStr = periodEnd.toISOString().slice(0, 10);

    const [tradesRes, libraryRes] = await Promise.all([
      supabase
        .from("trades")
        .select(
          "id, setup_id, exit_time, exit_price, net_pnl, r_multiple, stop_loss, risk_amount, target_price, notes, emotion, conviction, discipline_score, mistake_tags, entry_time",
        )
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .order("entry_time", { ascending: false })
        .limit(500),
      supabase.from("mistake_library").select("code, title"),
    ]);

    if (tradesRes.error) {
      return NextResponse.json({ error: tradesRes.error.message }, { status: 500 });
    }

    const allTrades = tradesRes.data ?? [];
    const periodTrades = allTrades.filter((t) => {
      const d = new Date(t.entry_time);
      return d >= periodStart && d <= periodEnd;
    });
    const analytics = computeTradeAnalytics(
      periodTrades.map((t) => ({
        net_pnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
        r_multiple: t.r_multiple !== null ? Number(t.r_multiple) : null,
        entry_time: t.entry_time,
      })),
    );

    for (const trade of periodTrades) {
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

      await supabase.from("trade_grades").upsert(
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
      );
    }

    let grades: Array<{ overall_grade: string; evidence: unknown }> = [];
    if (periodTrades.length > 0) {
      const { data } = await supabase
        .from("trade_grades")
        .select("overall_grade, evidence")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .in(
          "trade_id",
          periodTrades.map((t) => t.id),
        );
      grades = data ?? [];
    }

    const gradeScores = grades.map((g) => {
      const ev = g.evidence as { average_score?: number };
      return ev.average_score ?? letterToNumeric(g.overall_grade as string);
    });
    const average_overall =
      gradeScores.length > 0
        ? gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length
        : 5;
    const low_grade_count = grades.filter((g) =>
      ["D", "F", "C"].includes(g.overall_grade as string),
    ).length;
    const high_grade_count = grades.filter((g) =>
      ["A", "B+", "B"].includes(g.overall_grade as string),
    ).length;

    const mistake_costs = analyzeMistakeCosts(
      periodTrades.map((t) => ({
        mistake_tags: t.mistake_tags ?? [],
        net_pnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
      })),
      libraryRes.data ?? [],
    );

    const behavioral = computeBehavioralScore({
      trades: periodTrades.map((t) => ({
        emotion: t.emotion,
        discipline_score: t.discipline_score,
        mistake_tags: t.mistake_tags ?? [],
        notes: t.notes,
        setup_id: t.setup_id,
        net_pnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
        entry_time: t.entry_time,
      })),
    });

    const emotional_triggers = detectEmotionalTriggers(
      periodTrades.map((t) => ({
        mistake_tags: t.mistake_tags ?? [],
        net_pnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
      })),
    );

    const report = generateCoachingReport({
      period_start: periodStartStr,
      period_end: periodEndStr,
      analytics,
      mistake_costs,
      behavioral,
      grade_summary: { average_overall, low_grade_count, high_grade_count },
      emotional_triggers,
    });

    const { data: saved, error: saveError } = await supabase
      .from("coaching_reports")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          report_type: "weekly",
          period_start: periodStartStr,
          period_end: periodEndStr,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          highest_cost_mistake: report.highest_cost_mistake,
          repeated_patterns: report.repeated_patterns,
          emotional_triggers: report.emotional_triggers,
          stop_actions: report.stop_actions,
          improve_actions: report.improve_actions,
          repeat_actions: report.repeat_actions,
          next_week_focus: report.next_week_focus,
          confidence_score: report.confidence_score,
          evidence: report.evidence,
          summary_text: report.summary_text,
          metrics: analytics,
        },
        { onConflict: "tenant_id,user_id,report_type,period_start" },
      )
      .select()
      .single();

    if (saveError || !saved) {
      return NextResponse.json({ error: saveError?.message ?? "Save failed" }, { status: 500 });
    }

    await supabase.from("coaching_action_items").delete().eq("report_id", saved.id);

    const actionItems = [
      ...report.stop_actions.map((title) => ({
        tenant_id: tenantId,
        user_id: userId,
        report_id: saved.id,
        category: "stop" as const,
        title,
        priority: "high" as const,
      })),
      ...report.improve_actions.map((title) => ({
        tenant_id: tenantId,
        user_id: userId,
        report_id: saved.id,
        category: "improve" as const,
        title,
        priority: "medium" as const,
      })),
      ...report.repeat_actions.map((title) => ({
        tenant_id: tenantId,
        user_id: userId,
        report_id: saved.id,
        category: "repeat" as const,
        title,
        priority: "low" as const,
      })),
    ];

    if (actionItems.length > 0) {
      await supabase.from("coaching_action_items").insert(actionItems);
    }

    await supabase.from("behavioral_scores").upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        score_date: periodEndStr,
        period_type: "weekly",
        discipline_avg: behavioral.discipline_avg,
        emotion_stability: behavioral.emotion_stability,
        revenge_trade_risk: behavioral.revenge_trade_risk,
        journaling_completeness: behavioral.journaling_completeness,
        overall_behavioral_score: behavioral.overall_behavioral_score,
        evidence: behavioral.evidence,
      },
      { onConflict: "tenant_id,user_id,score_date,period_type" },
    );

    const { data: actions } = await supabase
      .from("coaching_action_items")
      .select("*")
      .eq("report_id", saved.id);

    return NextResponse.json({
      report: saved,
      action_items: actions ?? [],
      behavioral,
      mistake_costs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function letterToNumeric(grade: string): number {
  const map: Record<string, number> = {
    A: 9.5,
    "B+": 8.5,
    B: 7.5,
    "C+": 6.5,
    C: 5.5,
    D: 4,
    F: 2,
  };
  return map[grade] ?? 5;
}
