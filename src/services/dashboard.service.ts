import "server-only";
import { prisma } from "@/lib/prisma";
import {
  buildProfitTrend,
  buildSalesTrend,
  buildSiteDistribution,
  buildTopProducts,
  sumSalesInRange,
  sumSnapshots,
  startOfDay,
  type OrderItemLike,
  type OrderLike,
  type SnapshotLike,
} from "@/lib/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DashboardData {
  kpi: {
    todaySales: number;
    weekSales: number;
    weekDelta: number;
    monthSales: number;
    orderCount: number;
    productCount: number;
  };
  profit: ReturnType<typeof sumSnapshots>;
  salesTrend: ReturnType<typeof buildSalesTrend>;
  topProducts: ReturnType<typeof buildTopProducts>;
  siteDistribution: ReturnType<typeof buildSiteDistribution>;
  profitTrend: ReturnType<typeof buildProfitTrend>;
}

export async function getDashboardData(storeId: string | "all"): Promise<DashboardData> {
  const now = new Date();
  const today = startOfDay(now);
  const trendFrom = new Date(today.getTime() - 89 * DAY_MS); // 90 天订单窗口

  const storeFilter = storeId === "all" ? {} : { storeId };

  const [ordersRaw, itemsRaw, snapshotsRaw, productCount] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: trendFrom }, ...storeFilter },
      select: {
        totalAmount: true, createdAt: true, status: true,
        store: { select: { site: true } },
      },
    }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: new Date(today.getTime() - 29 * DAY_MS) }, ...storeFilter } },
      select: {
        productId: true, quantity: true, unitPrice: true,
        product: { select: { title: true } },
        order: { select: { createdAt: true, status: true } },
      },
    }),
    prisma.profitSnapshot.findMany({
      where: { date: { gte: new Date(today.getTime() - 29 * DAY_MS) }, ...storeFilter },
    }),
    prisma.product.count({ where: { status: "ACTIVE", ...storeFilter } }),
  ]);

  const orders: OrderLike[] = ordersRaw.map((o) => ({
    totalAmount: o.totalAmount.toNumber(),
    createdAt: o.createdAt,
    status: o.status,
    storeSite: o.store.site,
  }));

  const items: OrderItemLike[] = itemsRaw.map((i) => ({
    productId: i.productId,
    productTitle: i.product.title,
    quantity: i.quantity,
    unitPrice: i.unitPrice.toNumber(),
    orderCreatedAt: i.order.createdAt,
    orderStatus: i.order.status,
  }));

  const snapshots: SnapshotLike[] = snapshotsRaw.map((s) => ({
    date: s.date,
    revenue: s.revenue.toNumber(),
    productCost: s.productCost.toNumber(),
    commission: s.commission.toNumber(),
    fbaFee: s.fbaFee.toNumber(),
    adSpend: s.adSpend.toNumber(),
    logisticsCost: s.logisticsCost.toNumber(),
    netProfit: s.netProfit.toNumber(),
  }));

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    kpi: {
      todaySales: sumSalesInRange(orders, today, now),
      weekSales: sumSalesInRange(orders, new Date(today.getTime() - 6 * DAY_MS), now),
      weekDelta: (() => {
        const weekStart = new Date(today.getTime() - 6 * DAY_MS);
        const prevWeek = sumSalesInRange(orders, new Date(today.getTime() - 13 * DAY_MS), weekStart);
        return prevWeek > 0 ? Math.round(((sumSalesInRange(orders, weekStart, now) - prevWeek) / prevWeek) * 100) : 0;
      })(),
      monthSales: sumSalesInRange(orders, monthStart, now),
      orderCount: orders.filter(
        (o) => o.createdAt >= monthStart && ["SHIPPED", "IN_TRANSIT", "COMPLETED"].includes(o.status),
      ).length,
      productCount,
    },
    profit: sumSnapshots(snapshots),
    salesTrend: buildSalesTrend(orders, 30, now),
    topProducts: buildTopProducts(items, 30, 8, now),
    siteDistribution: buildSiteDistribution(orders),
    profitTrend: buildProfitTrend(snapshots, 30, now),
  };
}

