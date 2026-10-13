import { z } from "zod";

export const WAREHOUSE_TYPES = ["FBA", "OVERSEAS", "DOMESTIC"] as const;
export const INVENTORY_STATUSES = ["NORMAL", "LOW_STOCK", "OUT_OF_STOCK_RISK", "SLOW_MOVING"] as const;

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  storeId: z.string().optional(),
  warehouse: z.enum(WAREHOUSE_TYPES).optional(),
  status: z.enum(INVENTORY_STATUSES).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
});

export const adjustInventorySchema = z.object({
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().int("数量必须是整数").positive("数量必须大于 0").max(100000),
  reference: z.string().max(60).optional(),
  note: z.string().max(200).optional(),
});

export const transferInventorySchema = z.object({
  toWarehouse: z.enum(WAREHOUSE_TYPES),
  quantity: z.coerce.number().int().positive().max(100000),
  note: z.string().max(200).optional(),
});

export const safetyStockSchema = z.object({
  safetyStock: z.coerce.number().int().positive().max(100000),
});

export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type TransferInventoryInput = z.infer<typeof transferInventorySchema>;
