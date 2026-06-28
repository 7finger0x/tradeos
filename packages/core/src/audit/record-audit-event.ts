import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEventInput = {
  tenant_id?: string | null;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
};

export async function recordAuditEvent(
  supabase: SupabaseClient,
  input: AuditEventInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("audit_events")
    .insert({
      tenant_id: input.tenant_id ?? null,
      actor_id: input.actor_id,
      action: input.action,
      resource_type: input.resource_type,
      resource_id: input.resource_id ?? null,
      before_state: input.before_state ?? null,
      after_state: input.after_state ?? null,
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to record audit event: ${error.message}`);
  }

  return { id: data.id as string };
}
