import { z } from "zod";

export const CAMPAIGN_TYPES = ["SP", "SB", "SD"] as const;
export const CAMPAIGN_STATUSES = ["ENABLED", "PAUSED"] as const;

export const campaignQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  storeId: z.string().optional(),
  type: z.enum(CAMPAIGN_TYPES).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
});

export const createCampaignSchema = z.object({
  storeId: z.string().min(1, "请选择店铺"),
  name: z.string().min(2, "活动名称至少 2 字").max(100),
  type: z.enum(CAMPAIGN_TYPES, { message: "类型必须是 SP/SB/SD" }),
  dailyBudget: z.coerce.number().positive("日预算必须大于 0").max(10000),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  dailyBudget: z.coerce.number().positive().max(10000).optional(),
});

export type CampaignQuery = z.infer<typeof campaignQuerySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
