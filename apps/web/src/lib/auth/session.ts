import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type SessionContext = {
  userId: string;
  tenantId: string;
  role: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export async function getSession(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership?.tenant_id) return null;

  return {
    userId: user.id,
    tenantId: membership.tenant_id,
    role: membership.role,
    supabase,
  };
}

export async function requireApiSession(): Promise<SessionContext | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function isSessionError(
  value: SessionContext | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
