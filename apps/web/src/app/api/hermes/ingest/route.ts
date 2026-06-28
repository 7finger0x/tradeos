import { NextResponse } from "next/server";
import { requireOperatorSession, isOperatorSessionError } from "@/lib/hermes/require-operator";
import { ingestHermesLiquidity } from "@/lib/hermes/ingest-liquidity";

export async function POST(request: Request) {
  try {
    const session = await requireOperatorSession();
    if (isOperatorSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const body = (await request.json().catch(() => ({}))) as { chain_id?: string };
    const chainId = body.chain_id ?? "ethereum-mainnet";

    const result = await ingestHermesLiquidity(supabase, tenantId, userId, chainId);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
