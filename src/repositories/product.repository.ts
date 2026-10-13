import { prisma } from "@/lib/prisma";
import type { CreateProductInput, ProductQuery, UpdateProductInput } from "@/lib/validations/product";

export interface ProductListItem {
  id: string;
  sku: string;
  asin: string;
  fnsku: string;
  title: string;
  imageUrl: string | null;
  category: string;
  brand: string;
  costPrice: number;
  salePrice: number;
  status: string;
  storeName: string;
  storeSite: string;
  fbaQty: number;
}

export interface ProductDetail extends ProductListItem {
  storeId: string;
  weightGrams: number;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  inventories: { warehouseType: string; quantity: number; safetyStock: number; status: string }[];
  listing: { title: string; bullets: string[]; description: string; searchTerms: string } | null;
}

export async function searchProducts(query: ProductQuery) {
  const where = {
    deletedAt: null,
    ...(query.storeId && query.storeId !== "all" ? { storeId: query.storeId } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { sku: { contains: query.q, mode: "insensitive" as const } },
            { asin: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * 12,
      take: 12,
      include: {
        store: { select: { name: true, site: true } },
        listing: true,
        inventories: { where: { warehouseType: "FBA" } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { rows, total, page: query.page, pageSize: 12 };
}

export async function findProductDetail(id: string) {
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      store: { select: { id: true, name: true, site: true } },
      listing: true,
      inventories: { orderBy: { warehouseType: "asc" } },
    },
  });
}

export async function skuExistsInStore(storeId: string, sku: string, excludeId?: string) {
  const found = await prisma.product.findFirst({
    where: { storeId, sku, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  return found !== null;
}

export async function createProduct(data: CreateProductInput) {
  const { listing, imageUrl, ...rest } = data;
  return prisma.product.create({
    data: {
      ...rest,
      imageUrl: imageUrl || null,
      ...(listing ? { listing: { create: listing } } : {}),
    },
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const { listing, imageUrl, ...rest } = data;
  return prisma.product.update({
    where: { id },
    data: {
      ...rest,
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
      ...(listing
        ? {
            listing: {
              upsert: {
                create: listing,
                update: listing,
              },
            },
          }
        : {}),
    },
  });
}

export async function softDeleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { status: "DELETED", deletedAt: new Date() },
  });
}

export async function storeExists(storeId: string) {
  const found = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  return found !== null;
}
