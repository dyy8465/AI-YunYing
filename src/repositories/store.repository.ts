import { prisma } from "@/lib/prisma";
import type { CreateStoreInput, UpdateStoreInput } from "@/lib/validations/store";

export async function listStoresWithStats() {
  return prisma.store.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { products: { where: { status: "ACTIVE" } }, orders: true } },
    },
  });
}

export async function findStoreById(id: string) {
  return prisma.store.findUnique({ where: { id } });
}

export async function findStoreBySellerId(sellerId: string) {
  return prisma.store.findUnique({ where: { sellerId } });
}

export async function createStore(data: CreateStoreInput) {
  return prisma.store.create({ data });
}

export async function updateStore(id: string, data: UpdateStoreInput) {
  return prisma.store.update({ where: { id }, data });
}

export async function touchSync(id: string) {
  return prisma.store.update({
    where: { id },
    data: { lastSyncedAt: new Date(), apiStatus: "CONNECTED" },
  });
}
