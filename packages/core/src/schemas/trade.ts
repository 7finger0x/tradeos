import { z } from "zod";

export const AssetClassSchema = z.enum([
  "equity",
  "option",
  "future",
  "crypto",
  "forex",
  "other",
]);

export const TradeDirectionSchema = z.enum(["long", "short"]);

export const CreateTradeInputSchema = z.object({
  symbol: z.string().min(1).max(32),
  asset_class: AssetClassSchema.default("equity"),
  direction: TradeDirectionSchema,
  entry_time: z.string().datetime(),
  exit_time: z.string().datetime().optional().nullable(),
  entry_price: z.number().positive(),
  exit_price: z.number().positive().optional().nullable(),
  quantity: z.number().positive(),
  fees: z.number().min(0).default(0),
  gross_pnl: z.number().optional().nullable(),
  net_pnl: z.number().optional().nullable(),
  r_multiple: z.number().optional().nullable(),
  stop_loss: z.number().positive().optional().nullable(),
  target_price: z.number().positive().optional().nullable(),
  risk_amount: z.number().positive().optional().nullable(),
  setup_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  emotion: z.string().max(100).optional().nullable(),
  conviction: z.number().int().min(1).max(10).optional().nullable(),
  discipline_score: z.number().int().min(1).max(10).optional().nullable(),
  mistake_tags: z.array(z.string()).default([]),
  screenshot_urls: z.array(z.string()).default([]),
  broker: z.string().max(64).default("manual"),
  broker_trade_id: z.string().max(128).optional().nullable(),
});

export type CreateTradeInput = z.infer<typeof CreateTradeInputSchema>;

export const TradeSchema = CreateTradeInputSchema.extend({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  import_batch_id: z.string().uuid().nullable().optional(),
  trade_fingerprint: z.string(),
  trade_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Trade = z.infer<typeof TradeSchema>;

export const SetupSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Setup = z.infer<typeof SetupSchema>;

export const CreateSetupInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export type CreateSetupInput = z.infer<typeof CreateSetupInputSchema>;

export const ParsedCsvTradeSchema = z.object({
  symbol: z.string(),
  direction: TradeDirectionSchema,
  entry_time: z.string(),
  exit_time: z.string().optional().nullable(),
  entry_price: z.number(),
  exit_price: z.number().optional().nullable(),
  quantity: z.number(),
  fees: z.number().default(0),
  gross_pnl: z.number().optional().nullable(),
  net_pnl: z.number().optional().nullable(),
  broker_trade_id: z.string().optional().nullable(),
  broker: z.string().default("csv"),
});

export type ParsedCsvTrade = z.infer<typeof ParsedCsvTradeSchema>;
