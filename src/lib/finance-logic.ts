// 财务利润纯聚合函数：不依赖数据库，便于单元测试
import { round2, startOfDay } from "@/lib/analytics";


export interface ProfitRowLike {
  productId: string;
  sku: string;
  title: string;
  storeId: string;
  date: Date;
  revenue: number;
  productCost: number;
  commission: number;
  fbaFee: number;
  adSpend: number;
  logisticsCost: number;
  netProfit: number;
}

export interface ProfitSummary {
  revenue: number;
  productCost: number;
  commission: number;
  fbaFee: number;
  adSpend: number;
  logisticsCost: number;
  netProfit: number;
  totalCost: number;
  margin: number; // 净利率 %，保留 1 位小数
  adRatio: number; // 广告费占收入比 %，保留 1 位小数
}

export interface SkuProfitRow {
  productId: string;
  sku: string;
  title: string;
  revenue: number;
  productCost: number;
  commission: number;
  fbaFee: number;
  adSpend: number;
  logisticsCost: number;
  netProfit: number;
  margin: number;
}

export interface MonthlyProfitPoint {
  month: string; // YYYY-MM
  revenue: number;
  netProfit: number;
  margin: number;
}

const COST_KEYS = ["productCost", "commission", "fbaFee", "adSpend", "logisticsCost"] as const;

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/** 汇总利润快照：合计各成本项并计算净利率 / 广告占比 */
export function summarizeProfit(rows: ProfitRowLike[]): ProfitSummary {
  const sum = {
    revenue: 0, productCost: 0, commission: 0, fbaFee: 0,
    adSpend: 0, logisticsCost: 0, netProfit: 0,
  };
  for (const r of rows) {
    sum.revenue += r.revenue;
    sum.productCost += r.productCost;
    sum.commission += r.commission;
    sum.fbaFee += r.fbaFee;
    sum.adSpend += r.adSpend;
    sum.logisticsCost += r.logisticsCost;
    sum.netProfit += r.netProfit;
  }
  return {
    revenue: round2(sum.revenue),
    productCost: round2(sum.productCost),
    commission: round2(sum.commission),
    fbaFee: round2(sum.fbaFee),
    adSpend: round2(sum.adSpend),
    logisticsCost: round2(sum.logisticsCost),
    netProfit: round2(sum.netProfit),
    totalCost: round2(sum.productCost + sum.commission + sum.fbaFee + sum.adSpend + sum.logisticsCost),
    margin: pct(sum.netProfit, sum.revenue),
    adRatio: pct(sum.adSpend, sum.revenue),
  };
}

/** SKU 利润分析：按商品聚合，净利润降序 */
export function buildSkuProfitRows(rows: ProfitRowLike[]): SkuProfitRow[] {
  const agg = new Map<string, SkuProfitRow & { _revenue: number }>();
  for (const r of rows) {
    const cur =
      agg.get(r.productId) ??
      {
        productId: r.productId, sku: r.sku, title: r.title,
        revenue: 0, productCost: 0, commission: 0, fbaFee: 0,
        adSpend: 0, logisticsCost: 0, netProfit: 0, margin: 0, _revenue: 0,
      };
    cur.revenue += r.revenue;
    cur.productCost += r.productCost;
    cur.commission += r.commission;
    cur.fbaFee += r.fbaFee;
    cur.adSpend += r.adSpend;
    cur.logisticsCost += r.logisticsCost;
    cur.netProfit += r.netProfit;
    cur._revenue = cur.revenue;
    agg.set(r.productId, cur);
  }
  return [...agg.values()]
    .sort((a, b) => b.netProfit - a.netProfit)
    .map(({ _revenue, ...v }) => ({
      ...v,
      revenue: round2(v.revenue),
      productCost: round2(v.productCost),
      commission: round2(v.commission),
      fbaFee: round2(v.fbaFee),
      adSpend: round2(v.adSpend),
      logisticsCost: round2(v.logisticsCost),
      netProfit: round2(v.netProfit),
      margin: pct(v.netProfit, _revenue),
    }));
}

/** 月度利润趋势：连续月份补零，截止到当前月 */
export function buildMonthlyProfitTrend(
  rows: ProfitRowLike[],
  months: number,
  now = new Date(),
): MonthlyProfitPoint[] {
  const agg = new Map<string, { revenue: number; netProfit: number }>();
  for (const r of rows) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    const cur = agg.get(key) ?? { revenue: 0, netProfit: 0 };
    cur.revenue += r.revenue;
    cur.netProfit += r.netProfit;
    agg.set(key, cur);
  }
  const trend: MonthlyProfitPoint[] = [];
  const base = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const v = agg.get(key) ?? { revenue: 0, netProfit: 0 };
    trend.push({
      month: key,
      revenue: round2(v.revenue),
      netProfit: round2(v.netProfit),
      margin: pct(v.netProfit, v.revenue),
    });
  }
  return trend;
}

/** 成本结构：各成本项占收入比例（用于饼图/报表展示） */
export function buildCostBreakdown(summary: ProfitSummary): { name: string; value: number; ratio: number }[] {
  const labels: Record<(typeof COST_KEYS)[number], string> = {
    productCost: "商品成本",
    commission: "平台佣金",
    fbaFee: "FBA 费用",
    adSpend: "广告费用",
    logisticsCost: "物流费用",
  };
  return COST_KEYS.map((k) => ({
    name: labels[k],
    value: summary[k],
    ratio: pct(summary[k], summary.revenue),
  }));
}

/** 过滤时间范围内的快照行（含 from，不含 to） */
export function filterRowsInRange(rows: ProfitRowLike[], from: Date, to: Date): ProfitRowLike[] {
  const fromDay = startOfDay(from).getTime();
  const toDay = startOfDay(to).getTime();
  return rows.filter((r) => {
    const t = r.date.getTime();
    return t >= fromDay && t < toDay;
  });
}


