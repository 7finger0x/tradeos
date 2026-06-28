"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppRole, Tenant } from "@tradeos/core";

export type TenantContextValue = {
  tenant: Tenant | null;
  role: AppRole | null;
  isLoading: boolean;
};

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  role: null,
  isLoading: true,
});

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContextValue;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
