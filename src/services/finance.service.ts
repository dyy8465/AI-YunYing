import "server-only";
import { csvEscape } from "@/lib/order-state";
import {
  buildCostBreakdown,
  buildMonthlyProfitTrend,
  buildSkuProfitRows,
  filterRowsInRange,
  summarizeProfit,
  type ProfitRowLike,
} from "@/lib/finance-logic";
import type { FinanceQuery } from "@/lib/validations/finance";
import { findProfitSnapshots } from "@/repositories/finance.repository";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 31 * DAY_MS; // 月度趋势额外回看的近似窗口

export interface FinanceOverview {
  period: FinanceQuery["period"];
  summary: ReturnType<typeof summarizeProfit>;
  skuRows: ReturnType<typeof buildSkuProfitRows>;
  monthlyTrend: ReturnType<typeof buildMonthlyProfitTrend>;
  costBreakdown: ReturnType<typeof buildCostBreakdown>;
}

function toRows(
  snapshots: Awaited<ReturnType<typeof findProfitSnapshots>>,
): ProfitRowLike[] {
  return snapshots.map((s) => ({
    productId: s.productId,
    sku: s.product.sku,
    title: s.product.title,
    storeId: s.storeId,
    date: s.date,
    revenue: s.revenue.toNumber(),
    productCost: s.productCost.toNumber(),
    commission: s.commission.toNumber(),
    fbaFee: s.fbaFee.toNumber(),
    adSpend: s.adSpend.toNumber(),
    logisticsCost: s.logisticsCost.toNumber(),
    netProfit: s.netProfit.toNumber(),
  }));
}

export async function getFinanceOverview(query: FinanceQuery): Promise<FinanceOverview> {
  const days = Number(query.period);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodFrom = new Date(today.getTime() - (days - 1) * DAY_MS);
  // 月度趋势固定展示近 6 个月，取数窗口取二者较大值
  const trendFrom = new Date(today.getTime() - 6 * MONTH_MS);
  const from = periodFrom < trendFrom ? periodFrom : trendFrom;

  const snapshots = await findProfitSnapshots(from, query.storeId ?? "all");
  const rows = toRows(snapshots);
  const periodRows = filterRowsInRange(rows, periodFrom, today);

  const summary = summarizeProfit(periodRows);
  return {
    period: query.period,
    summary,
    skuRows: buildSkuProfitRows(periodRows),
    monthlyTrend: buildMonthlyProfitTrend(rows, 6, now),
    costBreakdown: buildCostBreakdown(summary),
  };
}

/** 导出当前筛选下的 SKU 利润报表 CSV（上限 1000 行由查询窗口自然约束） */
export async function exportFinanceCsv(query: FinanceQuery): Promise<string> {
  const { skuRows, period } = await getFinanceOverview(query);
  const header = [
    "SKU", "商品", "收入", "商品成本", "平台佣金", "FBA费用",
    "广告费用", "物流费用", "净利润", "净利率(%)",
  ];
  const lines = skuRows.map((r) =>
    [
      r.sku, r.title, r.revenue.toFixed(2), r.productCost.toFixed(2),
      r.commission.toFixed(2), r.fbaFee.toFixed(2), r.adSpend.toFixed(2),
      r.logisticsCost.toFixed(2), r.netProfit.toFixed(2), r.margin.toFixed(1),
    ].map(csvEscape).join(","),
  );
  // BOM 头保证 Excel 正确识别 UTF-8 中文
  return (
    "\uFEFF" +
    [`SKU 利润报表（${period} 天）`, "", [header.join(","), ...lines].join("\r\n")].join("\r\n")
  );
}
