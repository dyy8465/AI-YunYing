// 纯数据聚合函数：不依赖数据库，便于单元测试
export interface OrderLike {
  totalAmount: number;
  createdAt: Date;
  status: string;
  storeSite: string;
}

export interface OrderItemLike {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  orderCreatedAt: Date;
  orderStatus: string;
}

export interface SnapshotLike {
  date: Date;
  revenue: number;
  productCost: number;
  commission: number;
  fbaFee: number;
  adSpend: number;
  logisticsCost: number;
  netProfit: number;
}

const PAID_STATUSES = new Set(["SHIPPED", "IN_TRANSIT", "COMPLETED"]);
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function sumSalesInRange(orders: OrderLike[], from: Date, to: Date): number {
  return orders
    .filter((o) => o.createdAt >= from && o.createdAt < to && PAID_STATUSES.has(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);
}

export function buildSalesTrend(orders: OrderLike[], days: number, now = new Date()): { date: string; sales: number; orders: number }[] {
  const trend: { date: string; sales: number; orders: number }[] = [];
  const today = startOfDay(now);
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(today.getTime() - i * DAY_MS);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const dayOrders = orders.filter(
      (o) => o.createdAt >= dayStart && o.createdAt < dayEnd && PAID_STATUSES.has(o.status),
    );
    trend.push({
      date: dayStart.toISOString().slice(0, 10),
      sales: round2(dayOrders.reduce((s, o) => s + o.totalAmount, 0)),
      orders: dayOrders.length,
    });
  }
  return trend;
}

export function buildTopProducts(
  items: OrderItemLike[],
  days: number,
  limit = 8,
  now = new Date(),
): { name: string; quantity: number; sales: number }[] {
  const from = new Date(startOfDay(now).getTime() - (days - 1) * DAY_MS);
  const agg = new Map<string, { name: string; quantity: number; sales: number }>();
  for (const item of items) {
    if (item.orderCreatedAt < from || !PAID_STATUSES.has(item.orderStatus)) continue;
    const cur = agg.get(item.productId) ?? { name: item.productTitle, quantity: 0, sales: 0 };
    cur.quantity += item.quantity;
    cur.sales += item.quantity * item.unitPrice;
    agg.set(item.productId, cur);
  }
  return [...agg.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
    .map((v) => ({ ...v, sales: round2(v.sales) }));
}

export function buildSiteDistribution(orders: OrderLike[]): { name: string; value: number }[] {
  const agg = new Map<string, number>();
  for (const o of orders) {
    if (!PAID_STATUSES.has(o.status)) continue;
    agg.set(o.storeSite, (agg.get(o.storeSite) ?? 0) + o.totalAmount);
  }
  return [...agg.entries()]
    .map(([name, value]) => ({ name, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
}

export function sumSnapshots(snapshots: SnapshotLike[]): Omit<SnapshotLike, "date"> {
  const keys = ["revenue", "productCost", "commission", "fbaFee", "adSpend", "logisticsCost", "netProfit"] as const;
  const result = {
    revenue: 0, productCost: 0, commission: 0, fbaFee: 0,
    adSpend: 0, logisticsCost: 0, netProfit: 0,
  };
  for (const s of snapshots) {
    for (const k of keys) result[k] += s[k];
  }
  return {
    revenue: round2(result.revenue),
    productCost: round2(result.productCost),
    commission: round2(result.commission),
    fbaFee: round2(result.fbaFee),
    adSpend: round2(result.adSpend),
    logisticsCost: round2(result.logisticsCost),
    netProfit: round2(result.netProfit),
  };
}

export function buildProfitTrend(snapshots: SnapshotLike[], days: number, now = new Date()): { date: string; netProfit: number }[] {
  const today = startOfDay(now);
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  const agg = new Map<string, number>();
  for (const s of snapshots) {
    if (s.date < from) continue;
    const key = startOfDay(s.date).toISOString().slice(0, 10);
    agg.set(key, (agg.get(key) ?? 0) + s.netProfit);
  }
  const trend: { date: string; netProfit: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(today.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    trend.push({ date: key, netProfit: round2(agg.get(key) ?? 0) });
  }
  return trend;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
