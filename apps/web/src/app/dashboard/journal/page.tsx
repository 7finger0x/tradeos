import { JournalActions, JournalStats } from "@/components/journal/journal-stats";
import { SetupQuickAdd } from "@/components/journal/setup-quick-add";
import { TradeTable } from "@/components/journal/trade-table";

export default function JournalPage() {
  return (
    <>
      <div className="page-header">
        <h1>Trade Journal</h1>
        <JournalActions />
      </div>
      <JournalStats />
      <SetupQuickAdd />
      <h2 className="section-title">Recent trades</h2>
      <TradeTable />
    </>
  );
}
