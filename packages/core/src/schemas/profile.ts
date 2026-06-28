import { z } from "zod";
import { AppRoleSchema } from "./tenant";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  timezone: z.string(),
  risk_profile: z.record(z.unknown()),
  trading_style: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const TenantMemberSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: AppRoleSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type TenantMember = z.infer<typeof TenantMemberSchema>;
