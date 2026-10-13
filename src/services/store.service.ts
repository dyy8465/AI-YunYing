import "server-only";
import { prisma } from "@/lib/prisma";
import {
  createStore,
  findStoreBySellerId,
  findStoreById,
  listStoresWithStats,
  touchSync,
  updateStore,
} from "@/repositories/store.repository";
import type { CreateStoreInput, UpdateStoreInput } from "@/lib/validations/store";

/** 顶栏切换器用的精简列表 */
export async function listStores() {
  return prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, site: true, apiStatus: true, sellerId: true },
  });
}

/** 店铺管理页：带统计 */
export async function getStoresWithStats() {
  const stores = await listStoresWithStats();
  return stores.map((s) => ({
    id: s.id,
    name: s.name,
    site: s.site,
    marketplaceId: s.marketplaceId,
    sellerId: s.sellerId,
    currency: s.currency,
    apiStatus: s.apiStatus,
    lastSyncedAt: s.lastSyncedAt,
    productCount: s._count.products,
    orderCount: s._count.orders,
  }));
}

export async function createStoreGuarded(input: CreateStoreInput) {
  const existing = await findStoreBySellerId(input.sellerId);
  if (existing) {
    throw Object.assign(new Error("该 Seller ID 已绑定其他店铺"), { code: "SELLER_ID_EXISTS" });
  }
  return createStore(input);
}

export async function updateStoreGuarded(id: string, input: UpdateStoreInput) {
  const store = await findStoreById(id);
  if (!store) {
    throw Object.assign(new Error("店铺不存在"), { code: "STORE_NOT_FOUND" });
  }
  if (input.sellerId && input.sellerId !== store.sellerId) {
    const conflict = await findStoreBySellerId(input.sellerId);
    if (conflict) {
      throw Object.assign(new Error("该 Seller ID 已绑定其他店铺"), { code: "SELLER_ID_EXISTS" });
    }
  }
  return updateStore(id, input);
}

/** 模拟同步：更新时间 + 置为已连接 */
export async function syncStore(id: string) {
  const store = await findStoreById(id);
  if (!store) {
    throw Object.assign(new Error("店铺不存在"), { code: "STORE_NOT_FOUND" });
  }
  return touchSync(id);
}
