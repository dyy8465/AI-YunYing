import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import type { OrderQuery } from "@/lib/validations/order";

export function buildOrderWhere(query: OrderQuery) {
  return {
    ...(query.storeId && query.storeId !== "all" ? { storeId: query.storeId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.channel ? { channel: query.channel } : {}),
    ...(query.q
      ? {
          OR: [
            { amazonOrderId: { contains: query.q, mode: "insensitive" as const } },
            { buyerName: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function searchOrders(query: OrderQuery) {
  const where = buildOrderWhere(query);
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * 12,
      take: 12,
      include: {
        store: { select: { name: true, site: true } },
        items: { include: { product: { select: { title: true, sku: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { rows, total, page: query.page, pageSize: 12 };
}

export async function getOrderSummary(query: OrderQuery) {
  const where = buildOrderWhere(query);
  const grouped = await prisma.order.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });
  const map = new Map(grouped.map((g) => [g.status, g._count._all]));
  const all = [...map.values()].reduce((a, b) => a + b, 0);
  return {
    total: all,
    pending: (map.get("PENDING") ?? 0) + (map.get("PROCESSING") ?? 0),
    shipped: (map.get("SHIPPED") ?? 0) + (map.get("IN_TRANSIT") ?? 0),
    refunded: map.get("REFUNDED") ?? 0,
  };
}

export async function findOrderDetail(id: string) {
  return prisma.order.findFirst({
    where: { id },
    include: {
      store: { select: { id: true, name: true, site: true } },
      items: {
        include: { product: { select: { id: true, title: true, sku: true, asin: true } } },
      },
    },
  });
}

export async function transitionOrder(id: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id },
    data: {
      status,
      // 进入已发货及之后的状态时，若从未发货则记录发货时间
      ...(["SHIPPED", "IN_TRANSIT", "COMPLETED"].includes(status) ? { shippedAt: new Date() } : {}),
    },
  });
}

export async function listOrdersForExport(query: OrderQuery) {
  return prisma.order.findMany({
    where: buildOrderWhere(query),
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: { store: { select: { name: true } } },
  });
}

