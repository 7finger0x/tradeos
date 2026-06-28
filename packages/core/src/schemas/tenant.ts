import { z } from "zod";

export const AppRoleSchema = z.enum([
  "viewer",
  "trader",
  "analyst",
  "operator",
  "risk_admin",
  "compliance_admin",
  "tenant_admin",
  "system_admin",
]);

export type AppRole = z.infer<typeof AppRoleSchema>;

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  plan_type: z.string(),
  status: z.enum(["active", "suspended", "archived"]),
  data_retention_policy: z.record(z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Tenant = z.infer<typeof TenantSchema>;

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().nullable(),
  actor_id: z.string().uuid().nullable(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().uuid().nullable().optional(),
  before_state: z.record(z.unknown()).nullable().optional(),
  after_state: z.record(z.unknown()).nullable().optional(),
  created_at: z.string(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

/** Roles that may modify risk thresholds and operator settings */
export const OPERATOR_ROLES: AppRole[] = [
  "operator",
  "risk_admin",
  "compliance_admin",
  "tenant_admin",
  "system_admin",
];
