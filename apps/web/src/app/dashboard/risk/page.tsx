import { RiskEventList } from "@/components/risk/risk-event-list";
import { RiskRulesForm } from "@/components/risk/risk-rules-form";
import { RiskStatusCard } from "@/components/risk/risk-status-card";

export default function RiskPage() {
  return (
    <>
      <div className="page-header">
        <h1>Risk Manager</h1>
      </div>
      <div className="risk-layout">
        <RiskStatusCard />
        <RiskRulesForm />
      </div>
      <h2 className="section-title">Risk events</h2>
      <RiskEventList />
    </>
  );
}
