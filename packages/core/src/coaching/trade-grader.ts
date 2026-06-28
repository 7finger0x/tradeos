import type { TradeGradeInput, TradeGradeOutput } from "../schemas/coaching";

const REVENGE_TAGS = new Set(["revenge_trade", "fomo", "oversize"]);

export function gradeTrade(input: TradeGradeInput): TradeGradeOutput {
  const tags = input.mistake_tags ?? [];
  const evidence: Record<string, unknown> = { tags };

  const setup_quality = scoreSetup(input);
  const execution_quality = scoreExecution(input);
  const risk_management = scoreRisk(input);
  const discipline = scoreDiscipline(input, tags);
  const emotional_control = scoreEmotion(input, tags);
  const data_completeness = scoreCompleteness(input);

  const factors = [
    setup_quality,
    execution_quality,
    risk_management,
    discipline,
    emotional_control,
    data_completeness,
  ];
  const average = factors.reduce((a, b) => a + b, 0) / factors.length;
  const overall_grade = numericToLetter(average);

  const feedback = buildFeedback({
    overall_grade,
    setup_quality,
    execution_quality,
    risk_management,
    discipline,
    emotional_control,
    data_completeness,
    tags,
    net_pnl: input.net_pnl,
  });

  return {
    overall_grade,
    setup_quality,
    execution_quality,
    risk_management,
    discipline,
    emotional_control,
    data_completeness,
    feedback_text: feedback,
    evidence: {
      ...evidence,
      factor_scores: {
        setup_quality,
        execution_quality,
        risk_management,
        discipline,
        emotional_control,
        data_completeness,
      },
      average_score: Number(average.toFixed(2)),
    },
  };
}

function scoreSetup(input: TradeGradeInput): number {
  let score = 4;
  if (input.setup_id) score += 3;
  if (input.conviction && input.conviction >= 7) score += 2;
  else if (input.conviction && input.conviction >= 5) score += 1;
  if (input.mistake_tags?.includes("outside_playbook")) score -= 3;
  return clamp(score);
}

function scoreExecution(input: TradeGradeInput): number {
  let score = 5;
  if (input.exit_time && input.exit_price) score += 2;
  if (input.r_multiple !== null && input.r_multiple !== undefined) {
    if (input.r_multiple >= 1) score += 2;
    else if (input.r_multiple >= 0) score += 1;
    else score -= 1;
  }
  if (input.mistake_tags?.includes("chased_entry")) score -= 2;
  if (input.mistake_tags?.includes("early_exit")) score -= 1;
  if (input.mistake_tags?.includes("held_loser")) score -= 2;
  return clamp(score);
}

function scoreRisk(input: TradeGradeInput): number {
  let score = 4;
  if (input.stop_loss) score += 2;
  if (input.risk_amount) score += 2;
  if (input.target_price) score += 1;
  if (input.mistake_tags?.includes("no_stop")) score -= 3;
  if (input.mistake_tags?.includes("oversize")) score -= 2;
  return clamp(score);
}

function scoreDiscipline(input: TradeGradeInput, tags: string[]): number {
  if (input.discipline_score) return clamp(input.discipline_score);
  let score = 7;
  if (tags.length === 0) score += 1;
  if (tags.includes("outside_playbook")) score -= 3;
  if (tags.includes("held_loser")) score -= 2;
  return clamp(score);
}

function scoreEmotion(input: TradeGradeInput, tags: string[]): number {
  let score = 6;
  if (input.emotion) score += 1;
  const hasRevenge = tags.some((t) => REVENGE_TAGS.has(t));
  if (hasRevenge) score -= 3;
  if (tags.includes("fomo")) score -= 2;
  if (input.emotion && /calm|focused|neutral/i.test(input.emotion)) score += 1;
  if (input.emotion && /angry|frustrated|revenge|fomo/i.test(input.emotion)) score -= 2;
  return clamp(score);
}

function scoreCompleteness(input: TradeGradeInput): number {
  let score = 3;
  if (input.notes && input.notes.length > 10) score += 2;
  if (input.emotion) score += 2;
  if (input.setup_id) score += 2;
  if (input.discipline_score) score += 1;
  return clamp(score);
}

function clamp(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)));
}

function numericToLetter(avg: number): string {
  if (avg >= 9) return "A";
  if (avg >= 8) return "B+";
  if (avg >= 7) return "B";
  if (avg >= 6) return "C+";
  if (avg >= 5) return "C";
  if (avg >= 4) return "D";
  return "F";
}

function buildFeedback(ctx: {
  overall_grade: string;
  setup_quality: number;
  execution_quality: number;
  risk_management: number;
  discipline: number;
  emotional_control: number;
  data_completeness: number;
  tags: string[];
  net_pnl?: number | null;
}): string {
  const parts: string[] = [`Overall: ${ctx.overall_grade}.`];

  if (ctx.setup_quality < 6) parts.push("Link trades to playbook setups before entry.");
  if (ctx.risk_management < 6) parts.push("Define stop and risk amount on every trade.");
  if (ctx.emotional_control < 6) parts.push("Log emotion honestly — revenge/FOMO patterns detected.");
  if (ctx.data_completeness < 6) parts.push("Add notes and emotion tags for better coaching feedback.");
  if (ctx.execution_quality >= 8) parts.push("Execution quality is strong — maintain this standard.");
  if (ctx.discipline >= 8 && ctx.tags.length === 0) parts.push("Clean discipline on this trade.");

  if (ctx.net_pnl !== null && ctx.net_pnl !== undefined && ctx.net_pnl < 0 && ctx.tags.length > 0) {
    parts.push(`Loss with tagged mistakes (${ctx.tags.join(", ")}) — review before next session.`);
  }

  return parts.join(" ");
}
