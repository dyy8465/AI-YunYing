export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "IN_TRANSIT", "COMPLETED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "待付款",
  PROCESSING: "处理中",
  SHIPPED: "已发货",
  IN_TRANSIT: "运输中",
  COMPLETED: "已完成",
  REFUNDED: "已退款",
};

/** 状态机：当前状态 -> 允许流转的目标 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "REFUNDED"],
  SHIPPED: ["IN_TRANSIT", "REFUNDED"],
  IN_TRANSIT: ["COMPLETED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** 买家姓名脱敏：James Smith -> J*** */
export function maskName(name: string): string {
  if (!name) return "";
  const first = name.trim().charAt(0);
  return `${first}***`;
}

export function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
