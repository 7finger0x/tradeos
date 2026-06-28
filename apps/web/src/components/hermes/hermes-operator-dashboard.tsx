"use client";

import { useState } from "react";
import { useTenant } from "@/components/tenant-provider";
import { HermesStatusPanel } from "@/components/hermes/hermes-status-panel";
import { HermesThresholdsPanel } from "@/components/hermes/hermes-thresholds-panel";
import { HermesOperatorActionsPanel } from "@/components/hermes/hermes-operator-actions-panel";
import { HermesCompliancePanel } from "@/components/hermes/hermes-compliance-panel";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "thresholds", label: "Thresholds" },
  { id: "actions", label: "Actions" },
  { id: "compliance", label: "Compliance" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function HermesOperatorDashboard() {
  const [tab, setTab] = useState<TabId>("overview");
  const { role } = useTenant();

  return (
    <div className="hermes-dashboard">
      <nav className="hermes-tabs" aria-label="Hermes operator sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`hermes-tab${tab === t.id ? " hermes-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="hermes-tab-panel">
        {tab === "overview" ? <HermesStatusPanel /> : null}
        {tab === "thresholds" ? <HermesThresholdsPanel role={role} /> : null}
        {tab === "actions" ? <HermesOperatorActionsPanel /> : null}
        {tab === "compliance" ? <HermesCompliancePanel /> : null}
      </div>
    </div>
  );
}
