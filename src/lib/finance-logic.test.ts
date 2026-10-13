import { describe, expect, it } from "vitest";
import {
  buildCostBreakdown,
  buildMonthlyProfitTrend,
  buildSkuProfitRows,
  filterRowsInRange,
  summarizeProfit,
  type ProfitRowLike,
} from "@/lib/finance-logic";

const now = new Date("2026-10-13T15:00:00Z");

function row(overrides: Partial<ProfitRowLike> = {}): ProfitRowLike {
  return {
    productId: "p1",
    sku: "SKU-001",
    title: "商品 A",
    storeId: "s1",
    date: now,
    revenue: 100,
    productCost: 40,
    commission: 15,
    fbaFee: 5,
    adSpend: 10,
    logisticsCost: 5,
    netProfit: 25,
    ...overrides,
  };
}

describe("summarizeProfit", () => {
  it("汇总收入成本并计算净利率与广告占比", () => {
    const sum = summarizeProfit([row(), row({ revenue: 100, netProfit: 25 })]);
    expect(sum.revenue).toBe(200);
    expect(sum.totalCost).toBe(150);
    expect(sum.netProfit).toBe(50);
    expect(sum.margin).toBe(25);
    expect(sum.adRatio).toBe(10);
  });

  it("零收入时比率安全返回 0", () => {
    const sum = summarizeProfit([row({ revenue: 0, netProfit: 0, adSpend: 0 })]);
    expect(sum.margin).toBe(0);
    expect(sum.adRatio).toBe(0);
  });
});

describe("buildSkuProfitRows", () => {
  it("按 SKU 聚合并按净利润降序", () => {
    const rows = [
      row({ productId: "a", sku: "A", title: "A", netProfit: 10 }),
      row({ productId: "b", sku: "B", title: "B", netProfit: 99 }),
      row({ productId: "b", sku: "B", title: "B", netProfit: 1 }),
    ];
    const list = buildSkuProfitRows(rows);
    expect(list.length).toBe(2);
    expect(list[0]?.sku).toBe("B");
    expect(list[0]?.netProfit).toBe(100);
    expect(list[1]?.margin).toBe(10); // 净利率 = 10 / 100
  });
});

describe("buildMonthlyProfitTrend", () => {
  it("按月聚合并补齐缺失月份", () => {
    const rows = [
      row({ date: new Date(2026, 9, 1), revenue: 300, netProfit: 60 }),
      row({ date: new Date(2026, 7, 15), revenue: 200, netProfit: 40 }),
    ];
    const trend = buildMonthlyProfitTrend(rows, 3, now);
    expect(trend.length).toBe(3);
    expect(trend.map((t) => t.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(trend[0]?.revenue).toBe(200);
    expect(trend[1]?.netProfit).toBe(0);
    expect(trend[2]?.revenue).toBe(300);
    expect(trend[2]?.margin).toBe(20);
  });
});

describe("buildCostBreakdown", () => {
  it("输出五项成本及占比", () => {
    const items = buildCostBreakdown(summarizeProfit([row()]));
    expect(items.length).toBe(5);
    expect(items[0]).toMatchObject({ name: "商品成本", value: 40, ratio: 40 });
    expect(items[3]).toMatchObject({ name: "广告费用", value: 10, ratio: 10 });
  });
});

describe("filterRowsInRange", () => {
  it("按日期闭开区间过滤", () => {
    const rows = [
      row({ date: new Date(2026, 9, 10) }),
      row({ date: new Date(2026, 9, 12) }),
      row({ date: new Date(2026, 9, 13) }),
    ];
    const inRange = filterRowsInRange(rows, new Date(2026, 9, 10), new Date(2026, 9, 13));
    expect(inRange.length).toBe(2);
  });
});

