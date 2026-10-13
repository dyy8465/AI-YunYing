import "server-only";
import type { OrderStatus } from "@prisma/client";
import { canTransition, csvEscape, ORDER_STATUS_LABELS } from "@/lib/order-state";
import {
  findOrderDetail,
  getOrderSummary,
  listOrdersForExport,
  searchOrders,
  transitionOrder,
} from "@/repositories/order.repository";
import type { OrderQuery } from "@/lib/validations/order";

export interface OrderListItem {
  id: string;
  amazonOrderId: string;
  channel: string;
  status: OrderStatus;
  statusLabel: string;
  totalAmount: number;
  currency: string;
  buyerMasked: string;
  buyerCity: string | null;
  itemCount: number;
  itemTitles: string[];
  storeName: string;
  createdAt: string;
}

function bizError(message: string, code: string) {
  return Object.assign(new Error(message), { code });
}

export async function getOrders(query: OrderQuery) {
  const [{ rows, total, page, pageSize }, summary] = await Promise.all([
    searchOrders(query),
    getOrderSummary(query),
  ]);

  const items: OrderListItem[] = rows.map((o) => ({
    id: o.id,
    amazonOrderId: o.amazonOrderId,
    channel: o.channel,
    status: o.status,
    statusLabel: ORDER_STATUS_LABELS[o.status],
    totalAmount: o.totalAmount.toNumber(),
    currency: o.currency,
    buyerMasked: `${o.buyerName.trim().charAt(0)}***`,
    buyerCity: o.buyerCity,
    itemCount: o.itemCount,
    itemTitles: o.items.map((i) => i.product.title),
    storeName: o.store.name,
    createdAt: o.createdAt.toISOString(),
  }));

  return { items, total, page, pageSize, summary };
}

export async function getOrderById(id: string) {
  const o = await findOrderDetail(id);
  if (!o) return null;
  return {
    id: o.id,
    amazonOrderId: o.amazonOrderId,
    channel: o.channel,
    status: o.status,
    statusLabel: ORDER_STATUS_LABELS[o.status],
    totalAmount: o.totalAmount.toNumber(),
    currency: o.currency,
    buyerMasked: `${o.buyerName.trim().charAt(0)}***`,
    buyerCity: o.buyerCity,
    itemCount: o.itemCount,
    storeName: o.store.name,
    createdAt: o.createdAt.toISOString(),
    shippedAt: o.shippedAt?.toISOString() ?? null,
    items: o.items.map((i) => ({
      productId: i.productId,
      sku: i.product.sku,
      title: i.product.title,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
      subtotal: i.unitPrice.toNumber() * i.quantity,
    })),
  };
}

export async function transitionOrderGuarded(id: string, target: OrderStatus) {
  const current = await findOrderDetail(id);
  if (!current) {
    throw bizError("订单不存在", "ORDER_NOT_FOUND");
  }
  if (current.status === target) {
    throw bizError(`订单已处于「${ORDER_STATUS_LABELS[target]}」状态`, "INVALID_TRANSITION");
  }
  if (!canTransition(current.status, target)) {
    throw bizError(
      `不允许从「${ORDER_STATUS_LABELS[current.status]}」流转到「${ORDER_STATUS_LABELS[target]}」`,
      "INVALID_TRANSITION",
    );
  }
  return transitionOrder(id, target);
}

export async function exportOrdersCsv(query: OrderQuery): Promise<string> {
  const orders = await listOrdersForExport(query);
  const header = ["订单号", "店铺", "渠道", "状态", "买家", "城市", "商品数", "金额", "币种", "下单时间", "发货时间"];
  const lines = orders.map((o) =>
    [
      o.amazonOrderId,
      o.store.name,
      o.channel,
      ORDER_STATUS_LABELS[o.status],
      `${o.buyerName.trim().charAt(0)}***`,
      o.buyerCity ?? "",
      o.itemCount,
      o.totalAmount.toFixed(2),
      o.currency,
      o.createdAt.toISOString().replace("T", " ").slice(0, 19),
      o.shippedAt ? o.shippedAt.toISOString().replace("T", " ").slice(0, 19) : "",
    ].map(csvEscape).join(","),
  );
  // BOM 头保证 Excel 正确识别 UTF-8 中文
  return "\uFEFF" + [header.join(","), ...lines].join("\r\n");
}
