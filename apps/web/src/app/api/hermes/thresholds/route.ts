import { NextResponse } from "next/server";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import { requireOperatorSession, isOperatorSessionError } from "@/lib/hermes/require-operator";
import { recordAuditEvent } from "@tradeos/core";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, tenantId } = session;

    const { data, error } = await supabase
      .from("hermes_risk_thresholds")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("threshold_key");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ thresholds: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireOperatorSession();
    if (isOperatorSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const body = (await request.json()) as {
      threshold_key: string;
      value: number;
      enabled?: boolean;
    };

    if (!body.threshold_key || body.value === undefined) {
      return NextResponse.json({ error: "threshold_key and value required" }, { status: 400 });
    }

    const { data: before } = await supabase
      .from("hermes_risk_thresholds")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("threshold_key", body.threshold_key)
      .maybeSingle();

    const { data, error } = await supabase
      .from("hermes_risk_thresholds")
      .update({
        value: body.value,
        enabled: body.enabled ?? before?.enabled ?? true,
      })
      .eq("tenant_id", tenantId)
      .eq("threshold_key", body.threshold_key)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("hermes_operator_actions").insert({
      tenant_id: tenantId,
      operator_id: userId,
      action_type: "threshold_update",
      target_type: "hermes_risk_thresholds",
      target_id: data.id,
      payload: { threshold_key: body.threshold_key, value: body.value },
      status: "completed",
    });

    await recordAuditEvent(supabase, {
      tenant_id: tenantId,
      actor_id: userId,
      action: "hermes.threshold_update",
      resource_type: "hermes_risk_thresholds",
      resource_id: data.id,
      before_state: before ?? undefined,
      after_state: data as Record<string, unknown>,
    });

    return NextResponse.json({ threshold: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
