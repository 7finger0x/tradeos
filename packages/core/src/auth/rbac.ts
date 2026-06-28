import type { AppRole } from "../schemas/tenant";
import { OPERATOR_ROLES } from "../schemas/tenant";

const ROLE_RANK: Record<AppRole, number> = {
  viewer: 1,
  trader: 2,
  analyst: 3,
  operator: 4,
  risk_admin: 5,
  compliance_admin: 5,
  tenant_admin: 6,
  system_admin: 7,
};

export function hasMinimumRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function canAccessOperatorActions(role: AppRole): boolean {
  return OPERATOR_ROLES.includes(role);
}

export function canManageRiskRules(role: AppRole): boolean {
  return hasMinimumRole(role, "risk_admin");
}

export function canManageMembers(role: AppRole): boolean {
  return hasMinimumRole(role, "tenant_admin");
}

export function assertRole(
  userRole: AppRole,
  requiredRole: AppRole,
  action: string,
): void {
  if (!hasMinimumRole(userRole, requiredRole)) {
    throw new Error(`Unauthorized: ${action} requires ${requiredRole} or higher`);
  }
}
