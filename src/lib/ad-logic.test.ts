import { describe, expect, it } from "vitest";
import { computeMetrics, pct, suggestOptimization } from "./ad-logic";
import { campaignQuerySchema, createCampaignSchema } from "./validations/advertising";

describe("computeMetrics", () => {
  it("正确计算 CTR/CPC/ACOS/ROAS", () => {
    const m = computeMetrics({ impressions: 1000, clicks: 50, spend: 40, sales: 200, orders: 10 });
    expect(m.ctr).toBeCloseTo(0.05);
    expect(m.cpc).toBeCloseTo(0.8);
    expect(m.acos).toBeCloseTo(0.2);
    expect(m.roas).toBeCloseTo(5);
  });

  it("除零时返回 null 而非 Infinity", () => {
    const m = computeMetrics({ impressions: 0, clicks: 0, spend: 0, sales: 100, orders: 1 });
    expect(m.ctr).toBeNull();
    expect(m.cpc).toBeNull();
    expect(m.acos).toBe(0);
    expect(m.roas).toBeNull();
  });
});

describe("suggestOptimization", () => {
  it("ACOS 超标且花费高时建议降竞价", () => {
    const s = suggestOptimization({ impressions: 5000, clicks: 200, spend: 300, sales: 500, orders: 8 });
    expect(s).toContain("ACOS");
  });

  it("ROAS 优秀时建议加预算", () => {
    const s = suggestOptimization({ impressions: 5000, clicks: 100, spend: 50, sales: 300, orders: 6 });
    expect(s).toContain("追加");
  });

  it("表现正常时无建议", () => {
    const s = suggestOptimization({ impressions: 5000, clicks: 150, spend: 100, sales: 350, orders: 7 });
    expect(s).toBeNull();
  });
});

describe("pct", () => {
  it("null 显示 -，数值转百分比", () => {
    expect(pct(null)).toBe("-");
    expect(pct(0.256)).toBe("25.6%");
  });
});

describe("campaign schemas", () => {
  it("创建 schema 拒绝非法类型", () => {
    expect(createCampaignSchema.safeParse({ storeId: "s", name: "Test", type: "XX", dailyBudget: 10 }).success).toBe(false);
  });

  it("查询分页默认 1", () => {
    expect(campaignQuerySchema.parse({}).page).toBe(1);
  });
});
