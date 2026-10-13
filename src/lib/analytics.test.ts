import { describe, expect, it } from "vitest";
import {
  buildProfitTrend,
  buildSalesTrend,
  buildTopProducts,
  sumSnapshots,
  type OrderItemLike,
  type OrderLike,
  type SnapshotLike,
} from "@/lib/analytics";

const now = new Date("2026-10-13T15:00:00Z");

function order(offsetDays: number, amount: number, status = "COMPLETED"): OrderLike {
  return {
    totalAmount: amount,
    createdAt: new Date(now.getTime() - offsetDays * 86400000),
    status,
    storeSite: "US",
  };
}

describe("buildSalesTrend", () => {
  it("只统计已支付订单并按天聚合", () => {
    const orders = [order(1, 100), order(1, 50), order(2, 200), order(1, 999, "PENDING"), order(1, 888, "REFUNDED")];
    const trend = buildSalesTrend(orders, 3, now);
    expect(trend.length).toBe(3);
    // 3 天趋势的最后一天是今天，前一天对应 order(1)（实现按本地日分组）
    const day1 = trend[trend.length - 2];
    expect(day1?.sales).toBe(150);
    expect(day1?.orders).toBe(2);
  });
});

describe("buildTopProducts", () => {
  it("按销量排序并取前 N", () => {
    const items: OrderItemLike[] = [
      { productId: "a", productTitle: "A", quantity: 1, unitPrice: 10, orderCreatedAt: now, orderStatus: "COMPLETED" },
      { productId: "b", productTitle: "B", quantity: 5, unitPrice: 10, orderCreatedAt: now, orderStatus: "COMPLETED" },
      { productId: "c", productTitle: "C", quantity: 3, unitPrice: 10, orderCreatedAt: now, orderStatus: "COMPLETED" },
    ];
    const top = buildTopProducts(items, 30, 2, now);
    expect(top.length).toBe(2);
    expect(top[0]?.name).toBe("B");
  });
});

describe("sumSnapshots", () => {
  it("汇总各成本项", () => {
    const s: SnapshotLike[] = [
      { date: now, revenue: 100, productCost: 40, commission: 15, fbaFee: 5, adSpend: 10, logisticsCost: 5, netProfit: 25 },
      { date: now, revenue: 100, productCost: 40, commission: 15, fbaFee: 5, adSpend: 10, logisticsCost: 5, netProfit: 25 },
    ];
    const sum = sumSnapshots(s);
    expect(sum.revenue).toBe(200);
    expect(sum.netProfit).toBe(50);
  });
});

describe("buildProfitTrend", () => {
  it("缺失日期补零", () => {
    const trend = buildProfitTrend([], 3, now);
    expect(trend.length).toBe(3);
    expect(trend.every((t) => t.netProfit === 0)).toBe(true);
  });
});

