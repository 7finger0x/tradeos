import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnv } from "./env";

export function createSupabaseClient(env: SupabaseEnv): SupabaseClient {
  return createClient(env.url, env.anonKey);
}
