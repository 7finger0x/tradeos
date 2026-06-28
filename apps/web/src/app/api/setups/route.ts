import { NextResponse } from "next/server";
import { CreateSetupInputSchema } from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const { data, error } = await supabase
      .from("setups")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ setups: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const body = CreateSetupInputSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("setups")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        name: body.name,
        description: body.description ?? null,
        tags: body.tags,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ setup: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
