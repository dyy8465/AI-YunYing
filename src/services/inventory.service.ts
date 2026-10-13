import "server-only";
import { computeRestock } from "@/lib/inventory-logic";
import {
  adjustInventoryTx,
  findInventoryDetail,
  getInventorySummary,
  getSoldQuantities30d,
  searchInventories,
  transferInventoryTx,
  updateSafetyStock,
} from "@/repositories/inventory.repository";
import type { InventoryQuery } from "@/lib/validations/inventory";

export interface InventoryListItem {
  id: string;
  productId: string;
  title: string;
  sku: string;
  storeName: string;
  warehouse: string;
  quantity: number;
  safetyStock: number;
  status: string;
  movementCount: number;
  sold30d: number;
  velocity: number;
  daysOfCover: number | null;
  suggestedQty: number;
}

export async function getInventories(query: InventoryQuery) {
  const [{ rows, total, page, pageSize }, summary, soldMap] = await Promise.all([
    searchInventories(query),
    getInventorySummary(query),
    getSoldQuantities30d(),
  ]);

  const items: InventoryListItem[] = rows.map((inv) => {
    const sold30d = soldMap.get(inv.productId) ?? 0;
    const restock = computeRestock(inv.quantity, sold30d);
    return {
      id: inv.id,
      productId: inv.productId,
      title: inv.product.title,
      sku: inv.product.sku,
      storeName: inv.product.store.name,
      warehouse: inv.warehouseType,
      quantity: inv.quantity,
      safetyStock: inv.safetyStock,
      status: inv.status,
      movementCount: inv._count.movements,
      sold30d,
      velocity: restock.velocity,
      daysOfCover: restock.daysOfCover,
      suggestedQty: restock.suggestedQty,
    };
  });

  return { items, total, page, pageSize, summary };
}

export async function getInventoryById(id: string) {
  const inv = await findInventoryDetail(id);
  if (!inv) return null;
  const soldMap = await getSoldQuantities30d();
  const restock = computeRestock(inv.quantity, soldMap.get(inv.productId) ?? 0);
  return {
    id: inv.id,
    productId: inv.productId,
    title: inv.product.title,
    sku: inv.product.sku,
    asin: inv.product.asin,
    storeName: inv.product.store.name,
    warehouse: inv.warehouseType,
    quantity: inv.quantity,
    safetyStock: inv.safetyStock,
    status: inv.status,
    restock,
    movements: inv.movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      reference: m.reference,
      note: m.note,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export { adjustInventoryTx, transferInventoryTx, updateSafetyStock };

