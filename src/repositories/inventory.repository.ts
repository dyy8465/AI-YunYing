import { prisma } from "@/lib/prisma";
import type { Prisma, WarehouseType } from "@prisma/client";
import { computeInventoryStatus } from "@/lib/inventory-logic";
import type { AdjustInventoryInput, InventoryQuery, TransferInventoryInput } from "@/lib/validations/inventory";

export function buildInventoryWhere(query: InventoryQuery): Prisma.InventoryWhereInput {
  return {
    ...(query.warehouse ? { warehouseType: query.warehouse } : {}),
    ...(query.status ? { status: query.status } : {}),
    product: {
      deletedAt: null,
      ...(query.storeId && query.storeId !== "all" ? { storeId: query.storeId } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" as const } },
              { sku: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
  };
}

export async function searchInventories(query: InventoryQuery) {
  const where = buildInventoryWhere(query);
  const [rows, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      orderBy: [{ status: "desc" }, { quantity: "asc" }],
      skip: (query.page - 1) * 12,
      take: 12,
      include: {
        product: { select: { id: true, title: true, sku: true, store: { select: { name: true } } } },
        _count: { select: { movements: true } },
      },
    }),
    prisma.inventory.count({ where }),
  ]);
  return { rows, total, page: query.page, pageSize: 12 };
}

export async function getInventorySummary(query: InventoryQuery) {
  const where = buildInventoryWhere(query);
  const [byWarehouse, byStatus] = await Promise.all([
    prisma.inventory.groupBy({ by: ["warehouseType"], where, _sum: { quantity: true } }),
    prisma.inventory.groupBy({ by: ["status"], where, _count: { _all: true } }),
  ]);
  const wh = new Map(byWarehouse.map((g) => [g.warehouseType, g._sum.quantity ?? 0]));
  const st = new Map(byStatus.map((g) => [g.status, g._count._all]));
  return {
    fba: wh.get("FBA") ?? 0,
    overseas: wh.get("OVERSEAS") ?? 0,
    domestic: wh.get("DOMESTIC") ?? 0,
    alerts: (st.get("LOW_STOCK") ?? 0) + (st.get("OUT_OF_STOCK_RISK") ?? 0),
  };
}

/** 近 30 天已支付订单的 SKU 销量（productId -> qty） */
export async function getSoldQuantities30d() {
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { createdAt: { gte: from }, status: { in: ["SHIPPED", "IN_TRANSIT", "COMPLETED"] } },
    },
    _sum: { quantity: true },
  });
  return new Map(grouped.map((g) => [g.productId, g._sum.quantity ?? 0]));
}

export async function findInventoryDetail(id: string) {
  return prisma.inventory.findFirst({
    where: { id },
    include: {
      product: {
        select: { id: true, title: true, sku: true, asin: true, store: { select: { id: true, name: true } } },
      },
      movements: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

function bizError(message: string, code: string) {
  return Object.assign(new Error(message), { code });
}

export async function adjustInventoryTx(id: string, input: AdjustInventoryInput) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({ where: { id } });
    if (!inv) throw bizError("库存记录不存在", "INVENTORY_NOT_FOUND");

    if (input.type === "OUT" && inv.quantity < input.quantity) {
      throw bizError(`出库数量不足：当前 ${inv.quantity}，尝试出库 ${input.quantity}`, "INSUFFICIENT_STOCK");
    }
    const newQty = input.type === "IN" ? inv.quantity + input.quantity : inv.quantity - input.quantity;

    await tx.inventoryMovement.create({
      data: { inventoryId: id, type: input.type, quantity: input.quantity, reference: input.reference, note: input.note },
    });
    return tx.inventory.update({
      where: { id },
      data: { quantity: newQty, status: computeInventoryStatus(newQty, inv.safetyStock, inv.status) },
    });
  });
}

export async function transferInventoryTx(id: string, input: TransferInventoryInput) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.inventory.findUnique({ where: { id } });
    if (!source) throw bizError("库存记录不存在", "INVENTORY_NOT_FOUND");
    if (source.warehouseType === input.toWarehouse) {
      throw bizError("调拨目标仓库不能与当前仓库相同", "SAME_WAREHOUSE");
    }
    if (source.quantity < input.quantity) {
      throw bizError(`调拨数量不足：当前 ${source.quantity}，尝试调出 ${input.quantity}`, "INSUFFICIENT_STOCK");
    }

    // 目标仓记录不存在则创建（沿用源仓安全库存）
    let target = await tx.inventory.findFirst({
      where: { productId: source.productId, warehouseType: input.toWarehouse as WarehouseType },
    });
    if (!target) {
      target = await tx.inventory.create({
        data: { productId: source.productId, warehouseType: input.toWarehouse, quantity: 0, safetyStock: source.safetyStock },
      });
    }

    const ref = `TR-${Date.now().toString(36).toUpperCase()}`;
    await tx.inventoryMovement.create({
      data: { inventoryId: source.id, type: "TRANSFER", quantity: input.quantity, reference: ref, note: input.note ?? `调出至 ${input.toWarehouse}` },
    });
    await tx.inventoryMovement.create({
      data: { inventoryId: target.id, type: "TRANSFER", quantity: input.quantity, reference: ref, note: input.note ?? `调入自 ${source.warehouseType}` },
    });

    const sourceNew = source.quantity - input.quantity;
    await tx.inventory.update({
      where: { id: source.id },
      data: { quantity: sourceNew, status: computeInventoryStatus(sourceNew, source.safetyStock, source.status) },
    });
    const targetNew = target.quantity + input.quantity;
    await tx.inventory.update({
      where: { id: target.id },
      data: { quantity: targetNew, status: computeInventoryStatus(targetNew, target.safetyStock, target.status) },
    });
    return { ok: true };
  });
}

export async function updateSafetyStock(id: string, safetyStock: number) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({ where: { id } });
    if (!inv) throw bizError("库存记录不存在", "INVENTORY_NOT_FOUND");
    return tx.inventory.update({
      where: { id },
      data: { safetyStock, status: computeInventoryStatus(inv.quantity, safetyStock, inv.status) },
    });
  });
}
