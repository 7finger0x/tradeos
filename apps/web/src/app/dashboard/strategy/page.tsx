import { StrategyDashboard } from "@/components/strategy/strategy-dashboard";

export default function StrategyPage() {
  return (
    <>
      <div className="page-header">
        <h1>Strategy Analytics</h1>
        <p className="muted">
          Setup leaderboard, drawdown, equity curve, and performance breakdowns
        </p>
      </div>
      <StrategyDashboard />
    </>
  );
}
