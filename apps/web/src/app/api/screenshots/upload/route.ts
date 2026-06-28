import { NextResponse } from "next/server";
import {
  appendScreenshotPath,
  buildTradeScreenshotPath,
  recordAuditEvent,
  ScreenshotUploadInputSchema,
  TRADE_SCREENSHOTS_BUCKET,
  validateScreenshotUpload,
} from "@tradeos/core";
import { requireApiSession, isSessionError } from "@/lib/auth/session";
import { resolveScreenshotSignedUrls } from "@/lib/screenshots/signed-urls";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    if (isSessionError(session)) return session;
    const { supabase, userId, tenantId } = session;

    const formData = await request.formData();
    const tradeIdRaw = formData.get("trade_id");
    const file = formData.get("file");
    const privacyAck = formData.get("privacy_acknowledged");

    const parsedInput = ScreenshotUploadInputSchema.safeParse({
      trade_id: tradeIdRaw,
    });
    if (!parsedInput.success) {
      return NextResponse.json({ error: "Valid trade_id required" }, { status: 400 });
    }

    if (privacyAck !== "true") {
      return NextResponse.json(
        { error: "Privacy acknowledgment required before upload" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Screenshot file required" }, { status: 400 });
    }

    const validation = validateScreenshotUpload({
      mimeType: file.type,
      sizeBytes: file.size,
      filename: file.name,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const tradeId = parsedInput.data.trade_id;

    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("id, screenshot_urls")
      .eq("id", tradeId)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const storagePath = buildTradeScreenshotPath({
      tenantId,
      userId,
      tradeId,
      extension: validation.extension,
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(TRADE_SCREENSHOTS_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message ?? "Upload failed" },
        { status: 500 },
      );
    }

    const existingUrls = (trade.screenshot_urls ?? []) as string[];
    const updatedUrls = appendScreenshotPath(existingUrls, storagePath);

    const { error: updateError } = await supabase
      .from("trades")
      .update({ screenshot_urls: updatedUrls })
      .eq("id", tradeId)
      .eq("tenant_id", tenantId)
      .eq("user_id", userId);

    if (updateError) {
      await supabase.storage.from(TRADE_SCREENSHOTS_BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: updateError.message ?? "Failed to attach screenshot to trade" },
        { status: 500 },
      );
    }

    await recordAuditEvent(supabase, {
      tenant_id: tenantId,
      actor_id: userId,
      action: "screenshot.upload",
      resource_type: "trade",
      resource_id: tradeId,
      after_state: { storage_path: storagePath },
    });

    const [signed] = await resolveScreenshotSignedUrls(supabase, [storagePath]);

    return NextResponse.json({
      trade_id: tradeId,
      storage_path: storagePath,
      signed_url: signed?.signed_url ?? null,
      screenshot_urls: updatedUrls,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
