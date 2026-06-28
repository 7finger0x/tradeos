import { describe, expect, it } from "vitest";
import { gradeTrade } from "../coaching/trade-grader";
import { analyzeMistakeCosts } from "../coaching/mistake-analyzer";
import { computeBehavioralScore } from "../coaching/behavioral-scorer";
import { generateCoachingReport } from "../coaching/coaching-report-generator";

describe("trade grader", () => {
  it("grades a well-documented winning trade highly", () => {
    const grade = gradeTrade({
      setup_id: "00000000-0000-0000-0000-000000000001",
      exit_time: "2026-06-28T15:00:00Z",
      exit_price: 105,
      net_pnl: 250,
      r_multiple: 2,
      stop_loss: 98,
      risk_amount: 100,
      target_price: 110,
      notes: "Clean breakout with volume confirmation",
      emotion: "focused",
      conviction: 8,
      discipline_score: 9,
      mistake_tags: [],
    });
    expect(["A", "B+", "B"]).toContain(grade.overall_grade);
    expect(grade.setup_quality).toBeGreaterThanOrEqual(7);
    expect(grade.risk_management).toBeGreaterThanOrEqual(7);
  });

  it("penalizes revenge trade tags", () => {
    const grade = gradeTrade({
      exit_time: "2026-06-28T15:00:00Z",
      net_pnl: -150,
      mistake_tags: ["revenge_trade", "no_stop"],
      emotion: "frustrated",
    });
    expect(grade.emotional_control).toBeLessThanOrEqual(5);
    expect(grade.risk_management).toBeLessThanOrEqual(5);
    expect(grade.feedback_text).toMatch(/revenge|stop/i);
  });
});

describe("mistake analyzer", () => {
  it("ranks mistakes by total cost", () => {
    const costs = analyzeMistakeCosts(
      [
        { mistake_tags: ["revenge_trade"], net_pnl: -200 },
        { mistake_tags: ["revenge_trade"], net_pnl: -100 },
        { mistake_tags: ["fomo"], net_pnl: -50 },
      ],
      [{ code: "revenge_trade", title: "Revenge trade" }],
    );
    expect(costs[0]?.code).toBe("revenge_trade");
    expect(costs[0]?.total_cost).toBe(300);
    expect(costs[0]?.occurrence_count).toBe(2);
  });
});

describe("behavioral scorer", () => {
  it("flags elevated revenge risk", () => {
    const score = computeBehavioralScore({
      trades: [
        { mistake_tags: ["revenge_trade"], entry_time: "2026-06-28T10:00:00Z", net_pnl: -50 },
        { mistake_tags: ["fomo"], entry_time: "2026-06-28T11:00:00Z", net_pnl: -30 },
        { mistake_tags: [], entry_time: "2026-06-28T12:00:00Z", net_pnl: 20, emotion: "calm" },
      ],
    });
    expect(score.revenge_trade_risk).toBeGreaterThan(3);
  });
});

describe("coaching report generator", () => {
  it("produces structured report with action items", () => {
    const report = generateCoachingReport({
      period_start: "2026-06-22",
      period_end: "2026-06-28",
      analytics: {
        trade_count: 8,
        win_rate: 45,
        total_net_pnl: -120,
        expectancy: -15,
        profit_factor: 0.8,
        average_r: 0.6,
      },
      mistake_costs: [
        {
          code: "revenge_trade",
          title: "Revenge trade",
          occurrence_count: 2,
          total_cost: 200,
          average_cost: 100,
        },
      ],
      behavioral: {
        discipline_avg: 5,
        emotion_stability: 4,
        revenge_trade_risk: 6,
        journaling_completeness: 4,
        overall_behavioral_score: 4.5,
        evidence: {},
      },
      grade_summary: { average_overall: 5.2, low_grade_count: 2, high_grade_count: 1 },
      emotional_triggers: ["revenge trade"],
    });
    expect(report.weaknesses.length).toBeGreaterThan(0);
    expect(report.stop_actions.length).toBeGreaterThan(0);
    expect(report.highest_cost_mistake).toContain("Revenge trade");
    expect(report.summary_text).toContain("Weekly Coaching Report");
    expect(report.confidence_score).toBeGreaterThan(0);
  });
});
