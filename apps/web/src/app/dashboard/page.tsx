import { RiskStatusCard } from "@/components/risk/risk-status-card";
import { BriefingWidget } from "@/components/briefing/briefing-panel";
import { CoachWidget } from "@/components/coach/coach-panel";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      <h1>Today</h1>
      <div className="widgets">
        <section>
          <h2 className="widget-title">Risk status</h2>
          <RiskStatusCard compact />
          <Link href="/dashboard/risk" className="muted widget-link">
            Open risk console →
          </Link>
        </section>
        <section>
          <h2 className="widget-title">Market briefing</h2>
          <BriefingWidget compact />
          <Link href="/dashboard/briefing" className="muted widget-link">
            Open briefing →
          </Link>
        </section>
        <section className="card">
          <h2>Strategy analytics</h2>
          <p className="muted">
            <Link href="/dashboard/strategy">Setup leaderboard &amp; drawdown →</Link>
          </p>
        </section>
        <section className="card">
          <h2>Recent trades</h2>
          <p className="muted">
            <Link href="/dashboard/journal">Open journal →</Link>
          </p>
        </section>
        <section>
          <h2 className="widget-title">Coach notes</h2>
          <CoachWidget compact />
          <Link href="/dashboard/coach" className="muted widget-link">
            Open coach →
          </Link>
        </section>
      </div>
    </>
  );
}
