import { z } from "zod";

export const STORE_SITES = ["US", "EU", "JP", "CA"] as const;
export const STORE_CURRENCIES = ["USD", "EUR", "JPY", "CAD", "GBP"] as const;
export const API_STATUSES = ["CONNECTED", "DISCONNECTED", "ERROR"] as const;

export const createStoreSchema = z.object({
  name: z.string().min(1, "店铺名称不能为空").max(60, "最多 60 字符"),
  site: z.enum(STORE_SITES, { message: "站点必须是 US/EU/JP/CA" }),
  marketplaceId: z.string().min(4, "Marketplace ID 至少 4 位").max(30),
  sellerId: z.string().min(6, "Seller ID 至少 6 位").max(30).regex(/^[A-Za-z0-9-]+$/, "Seller ID 只能包含字母、数字、连字符"),
  currency: z.enum(STORE_CURRENCIES).default("USD"),
});

export const updateStoreSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  site: z.enum(STORE_SITES).optional(),
  marketplaceId: z.string().min(4).max(30).optional(),
  sellerId: z.string().min(6).max(30).regex(/^[A-Za-z0-9-]+$/).optional(),
  apiStatus: z.enum(API_STATUSES).optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
