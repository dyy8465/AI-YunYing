import type { InventoryStatus } from "@prisma/client";

/**
 * 根据数量与安全库存重算状态。
 * 规则：0 = 断货风险；< 安全库存 = 预警；滞销标记由运营手动维护，库存充足时保留。
 */
export function computeInventoryStatus(
  quantity: number,
  safetyStock: number,
  current: InventoryStatus,
): InventoryStatus {
  if (quantity <= 0) return "OUT_OF_STOCK_RISK";
  if (quantity < safetyStock) return "LOW_STOCK";
  if (current === "SLOW_MOVING") return "SLOW_MOVING";
  return "NORMAL";
}

export interface RestockSuggestion {
  velocity: number; // 近 30 天日均销量
  daysOfCover: number | null; // 预计售罄天数（null = 充裕）
  suggestedQty: number; // 建议补货数量（补到 60 天覆盖）
}

/** 建议补到 60 天覆盖；日均销量为 0 视为充裕 */
export function computeRestock(quantity: number, sold30d: number): RestockSuggestion {
  const velocity = sold30d / 30;
  if (velocity <= 0) return { velocity: 0, daysOfCover: null, suggestedQty: 0 };
  const daysOfCover = Math.floor(quantity / velocity);
  const target = Math.ceil(velocity * 60);
  const suggestedQty = Math.max(0, target - quantity);
  return {
    velocity: Math.round(velocity * 10) / 10,
    daysOfCover,
    suggestedQty,
  };
}
