import { describe, expect, it } from "vitest";
import { computeInventoryStatus, computeRestock } from "./inventory-logic";
import { adjustInventorySchema, inventoryQuerySchema } from "./validations/inventory";

describe("computeInventoryStatus", () => {
  it("零库存判定断货风险", () => {
    expect(computeInventoryStatus(0, 50, "NORMAL")).toBe("OUT_OF_STOCK_RISK");
  });

  it("低于安全库存判定预警", () => {
    expect(computeInventoryStatus(49, 50, "NORMAL")).toBe("LOW_STOCK");
  });

  it("充足时保留滞销标记", () => {
    expect(computeInventoryStatus(500, 50, "SLOW_MOVING")).toBe("SLOW_MOVING");
    expect(computeInventoryStatus(500, 50, "NORMAL")).toBe("NORMAL");
  });
});

describe("computeRestock", () => {
  it("日均销量为 0 时视为充裕", () => {
    const r = computeRestock(100, 0);
    expect(r.daysOfCover).toBeNull();
    expect(r.suggestedQty).toBe(0);
  });

  it("按 60 天覆盖计算建议补货量", () => {
    // 30 天卖 300 件 -> 日均 10 -> 目标 600，当前 100 -> 建议 500
    const r = computeRestock(100, 300);
    expect(r.velocity).toBe(10);
    expect(r.daysOfCover).toBe(10);
    expect(r.suggestedQty).toBe(500);
  });
});

describe("adjustInventorySchema", () => {
  it("拒绝非正数数量", () => {
    expect(adjustInventorySchema.safeParse({ type: "IN", quantity: 0 }).success).toBe(false);
  });

  it("拒绝未知类型", () => {
    expect(adjustInventorySchema.safeParse({ type: "MOVE", quantity: 5 }).success).toBe(false);
  });

  it("查询分页默认为 1", () => {
    expect(inventoryQuerySchema.parse({}).page).toBe(1);
  });
});
