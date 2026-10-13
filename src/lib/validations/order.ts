import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/order-state";

export const ORDER_CHANNELS = ["FBA", "FBM"] as const;

export const orderQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  storeId: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  channel: z.enum(ORDER_CHANNELS).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
});

export const transitionOrderSchema = z.object({
  target: z.enum(ORDER_STATUSES),
});

export type OrderQuery = z.infer<typeof orderQuerySchema>;
