# Data Model: Phase 9 (read surfaces, no new tables)

## Read APIs

| Endpoint | Source table | Access |
|----------|--------------|--------|
| `GET /api/hermes/status` | agents, providers, observations, thresholds | Tenant member |
| `GET /api/hermes/operator-actions` | `hermes_operator_actions` | Tenant member |
| `GET /api/hermes/compliance` | `audit_events` | Tenant member |
| `GET/PUT /api/hermes/thresholds` | `hermes_risk_thresholds` | GET all; PUT operator |

## UI tabs → data sources

| Tab | Components | Data |
|-----|------------|------|
| Overview | `HermesStatusPanel` | `/api/hermes/status` |
| Thresholds | `HermesThresholdsPanel` | `/api/hermes/thresholds` |
| Actions | `HermesOperatorActionsPanel` | `/api/hermes/operator-actions` |
| Compliance | `HermesCompliancePanel` | `/api/hermes/compliance` |

## Operator action types (existing)

- `liquidity_ingest`
- `threshold_update`

## Compliance audit actions (existing)

- `hermes.liquidity_ingest`
- `hermes.threshold_update`
- `access.denied` + `resource_type: hermes_operator`
