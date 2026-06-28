import { HermesOperatorDashboard } from "@/components/hermes/hermes-operator-dashboard";

export default function HermesPage() {
  return (
    <>
      <div className="page-header">
        <h1>Hermes Operator Dashboard</h1>
        <p className="muted">
          Liquidity operations, thresholds, action log, and compliance evidence
        </p>
      </div>
      <HermesOperatorDashboard />
    </>
  );
}
