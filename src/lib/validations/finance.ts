import { z } from "zod";

export const FINANCE_PERIODS = ["30", "90", "365"] as const;
export type FinancePeriod = (typeof FINANCE_PERIODS)[number];

export const FINANCE_PERIOD_LABELS: Record<FinancePeriod, string> = {
  "30": "近 30 天",
  "90": "近 90 天",
  "365": "近 365 天",
};

export const financeQuerySchema = z.object({
  storeId: z.string().optional(),
  period: z.enum(FINANCE_PERIODS).default("30"),
});

export type FinanceQuery = z.infer<typeof financeQuerySchema>;
