import type { MistakeCost } from "../schemas/coaching";

export type TradeWithMistakes = {
  mistake_tags: string[];
  net_pnl: number | null;
};

export type MistakeLibraryEntry = {
  code: string;
  title: string;
};

export function analyzeMistakeCosts(
  trades: TradeWithMistakes[],
  library: MistakeLibraryEntry[] = [],
): MistakeCost[] {
  const titleByCode = new Map(library.map((m) => [m.code, m.title]));
  const agg = new Map<string, { count: number; total: number }>();

  for (const trade of trades) {
    const pnl = trade.net_pnl ?? 0;
    for (const tag of trade.mistake_tags ?? []) {
      const cur = agg.get(tag) ?? { count: 0, total: 0 };
      cur.count += 1;
      if (pnl < 0) cur.total += Math.abs(pnl);
      agg.set(tag, cur);
    }
  }

  return [...agg.entries()]
    .map(([code, { count, total }]) => ({
      code,
      title: titleByCode.get(code) ?? code.replace(/_/g, " "),
      occurrence_count: count,
      total_cost: Number(total.toFixed(2)),
      average_cost: count > 0 ? Number((total / count).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.total_cost - a.total_cost);
}

export function detectEmotionalTriggers(trades: TradeWithMistakes[]): string[] {
  const triggers = new Set<string>();
  for (const trade of trades) {
    for (const tag of trade.mistake_tags ?? []) {
      if (tag === "revenge_trade" || tag === "fomo" || tag === "oversize") {
        triggers.add(tag.replace(/_/g, " "));
      }
    }
  }
  return [...triggers];
}
