import type { SupabaseClient } from "@supabase/supabase-js";
import { TRADE_SCREENSHOTS_BUCKET } from "@tradeos/core";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function resolveScreenshotSignedUrls(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Array<{ path: string; signed_url: string | null }>> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(TRADE_SCREENSHOTS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      return {
        path,
        signed_url: error ? null : (data?.signedUrl ?? null),
      };
    }),
  );

  return results;
}
