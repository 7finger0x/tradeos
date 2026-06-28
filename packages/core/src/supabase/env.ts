import { z } from "zod";

const SupabaseEnvSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export type SupabaseEnv = z.infer<typeof SupabaseEnvSchema>;

export function getSupabaseEnvFromProcess(): SupabaseEnv {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "";

  return SupabaseEnvSchema.parse({ url, anonKey });
}

export function getSupabaseEnvFromPublic(url: string, anonKey: string): SupabaseEnv {
  return SupabaseEnvSchema.parse({ url, anonKey });
}
