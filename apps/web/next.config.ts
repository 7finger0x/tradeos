import path from "node:path";
import { loadEnvConfig } from "@next/env";

// Monorepo: load `.env*` from repo root (see README quick start).
const repoRoot = path.join(__dirname, "../..");
const { combinedEnv } = loadEnvConfig(repoRoot);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Edge middleware only inlines env discovered here — not from loadEnvConfig alone.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: combinedEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: combinedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    NEXT_PUBLIC_APP_URL: combinedEnv.NEXT_PUBLIC_APP_URL ?? "",
  },
  transpilePackages: ["@tradeos/core", "@tradeos/ui", "@tradeos/integrations"],
};

export default nextConfig;
