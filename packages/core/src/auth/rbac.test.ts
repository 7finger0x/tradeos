import { describe, expect, it } from "vitest";
import {
  assertRole,
  canAccessOperatorActions,
  canManageRiskRules,
  hasMinimumRole,
} from "../auth/rbac";

describe("rbac", () => {
  it("ranks roles correctly", () => {
    expect(hasMinimumRole("tenant_admin", "trader")).toBe(true);
    expect(hasMinimumRole("trader", "tenant_admin")).toBe(false);
  });

  it("identifies operator access", () => {
    expect(canAccessOperatorActions("operator")).toBe(true);
    expect(canAccessOperatorActions("trader")).toBe(false);
  });

  it("identifies risk admin access", () => {
    expect(canManageRiskRules("risk_admin")).toBe(true);
    expect(canManageRiskRules("trader")).toBe(false);
  });

  it("throws on insufficient role", () => {
    expect(() => assertRole("viewer", "tenant_admin", "manage members")).toThrow(
      /Unauthorized/,
    );
  });
});
