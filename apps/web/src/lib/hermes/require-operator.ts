import { NextResponse } from "next/server";
import { AppRoleSchema, canAccessOperatorActions, recordDeniedAccess } from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function requireOperatorSession(): Promise<
  Awaited<ReturnType<typeof requireApiSession>>
> {
  const session = await requireApiSession();
  if (isSessionError(session)) return session;

  const parsed = AppRoleSchema.safeParse(session.role);
  if (!parsed.success || !canAccessOperatorActions(parsed.data)) {
    await recordDeniedAccess(session.supabase, {
      tenant_id: session.tenantId,
      actor_id: session.userId,
      action: "access.denied",
      resource_type: "hermes_operator",
      reason: "Operator access required",
      metadata: { role: session.role, required: "operator" },
    });
    return NextResponse.json(
      { error: "Operator access required" },
      { status: 403 },
    );
  }

  return session;
}

export function isOperatorSessionError(
  value: Awaited<ReturnType<typeof requireApiSession>>,
): value is NextResponse {
  return value instanceof NextResponse;
}
