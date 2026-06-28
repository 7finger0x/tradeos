import { NextResponse } from "next/server";
import {
  normalizeTradeInput,
  parseTradeCsv,
  recordAuditEvent,
  type CsvFormat,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const formData = await request.formData();
    const file = formData.get("file");
    const format = (formData.get("format") as CsvFormat | null) ?? undefined;
    const filename = file instanceof File ? file.name : "import.csv";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file required" }, { status: 400 });
    }

    const content = await file.text();
    const parsed = parseTradeCsv(content, format || undefined);

    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        filename,
        broker: parsed.format,
        format: parsed.format,
        row_count: parsed.trades.length + parsed.errors.length,
        status: "processing",
      })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: batchError?.message ?? "Batch failed" }, { status: 500 });
    }

    let imported = 0;
    let duplicates = 0;
    let errors = parsed.errors.length;

    for (let i = 0; i < parsed.trades.length; i++) {
      const row = parsed.trades[i];
      if (!row) continue;

      const normalized = normalizeTradeInput({
        symbol: row.symbol,
        direction: row.direction,
        entry_time: row.entry_time,
        exit_time: row.exit_time,
        entry_price: row.entry_price,
        exit_price: row.exit_price,
        quantity: row.quantity,
        fees: row.fees,
        gross_pnl: row.gross_pnl,
        net_pnl: row.net_pnl,
        broker: row.broker,
        broker_trade_id: row.broker_trade_id,
        asset_class: "equity",
        mistake_tags: [],
        screenshot_urls: [],
      });

      const { data: trade, error: tradeError } = await supabase
        .from("trades")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          symbol: normalized.symbol,
          asset_class: normalized.asset_class,
          direction: normalized.direction,
          entry_time: normalized.entry_time,
          exit_time: normalized.exit_time ?? null,
          entry_price: normalized.entry_price,
          exit_price: normalized.exit_price ?? null,
          quantity: normalized.quantity,
          fees: normalized.fees,
          gross_pnl: normalized.gross_pnl ?? null,
          net_pnl: normalized.net_pnl,
          r_multiple: normalized.r_multiple,
          broker: normalized.broker,
          broker_trade_id: normalized.broker_trade_id ?? null,
          import_batch_id: batch.id,
          trade_fingerprint: normalized.trade_fingerprint,
        })
        .select("id")
        .single();

      const rowStatus =
        tradeError?.code === "23505" ? "duplicate" : trade ? "imported" : "error";

      if (rowStatus === "imported") imported++;
      if (rowStatus === "duplicate") duplicates++;
      if (rowStatus === "error") errors++;

      await supabase.from("import_rows").insert({
        batch_id: batch.id,
        tenant_id: tenantId,
        row_number: i + 1,
        raw_data: row,
        status: rowStatus,
        trade_id: trade?.id ?? null,
        error_message: tradeError?.message ?? null,
        fingerprint: normalized.trade_fingerprint,
      });
    }

    await supabase
      .from("import_batches")
      .update({
        imported_count: imported,
        duplicate_count: duplicates,
        error_count: errors,
        status: "completed",
      })
      .eq("id", batch.id);

    await recordAuditEvent(supabase, {
      tenant_id: tenantId,
      actor_id: userId,
      action: "trade.import",
      resource_type: "import_batch",
      resource_id: batch.id,
      after_state: { imported, duplicates, errors, format: parsed.format },
    });

    return NextResponse.json({
      batch_id: batch.id,
      format: parsed.format,
      imported,
      duplicates,
      errors,
      parse_errors: parsed.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
