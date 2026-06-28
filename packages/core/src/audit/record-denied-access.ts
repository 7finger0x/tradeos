import type { SupabaseClient } from "@supabase/supabase-js";

export type DeniedAccessInput = {
  tenant_id?: string | null;
  actor_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  reason: string;
  metadata?: Record<string, unknown>;
};

export async function recordDeniedAccess(
  supabase: SupabaseClient,
  input: DeniedAccessInput,
): Promise<void> {
  if (!input.actor_id) return;

  await supabase.from("audit_events").insert({
    tenant_id: input.tenant_id ?? null,
    actor_id: input.actor_id,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id ?? null,
    after_state: {
      denied: true,
      reason: input.reason,
      ...input.metadata,
    },
  });
}
