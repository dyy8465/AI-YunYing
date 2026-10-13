import "server-only";
import {
  createProduct,
  findProductDetail,
  searchProducts,
  skuExistsInStore,
  softDeleteProduct,
  storeExists,
  updateProduct,
} from "@/repositories/product.repository";
import type { CreateProductInput, ProductQuery, UpdateProductInput } from "@/lib/validations/product";
import type { ProductDetail, ProductListItem } from "@/repositories/product.repository";

function bizError(message: string, code: string) {
  return Object.assign(new Error(message), { code });
}

function toBullets(bullets: unknown): string[] {
  return Array.isArray(bullets) ? bullets.map(String) : [];
}

export async function getProducts(query: ProductQuery): Promise<{ items: ProductListItem[]; total: number; page: number; pageSize: number }> {
  const { rows, total, page, pageSize } = await searchProducts(query);
  return {
    items: rows.map((p): ProductListItem => ({
      id: p.id,
      sku: p.sku,
      asin: p.asin,
      fnsku: p.fnsku,
      title: p.title,
      imageUrl: p.imageUrl,
      category: p.category,
      brand: p.brand,
      costPrice: p.costPrice.toNumber(),
      salePrice: p.salePrice.toNumber(),
      status: p.status,
      storeName: p.store.name,
      storeSite: p.store.site,
      fbaQty: p.inventories[0]?.quantity ?? 0,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const p = await findProductDetail(id);
  if (!p) return null;
  return {
    id: p.id,
    storeId: p.storeId,
    sku: p.sku,
    asin: p.asin,
    fnsku: p.fnsku,
    title: p.title,
    imageUrl: p.imageUrl,
    category: p.category,
    brand: p.brand,
    costPrice: p.costPrice.toNumber(),
    salePrice: p.salePrice.toNumber(),
    status: p.status,
    storeName: p.store.name,
    storeSite: p.store.site,
    weightGrams: p.weightGrams,
    lengthMm: p.lengthMm,
    widthMm: p.widthMm,
    heightMm: p.heightMm,
    fbaQty: p.inventories.find((i) => i.warehouseType === "FBA")?.quantity ?? 0,
    inventories: p.inventories.map((i) => ({
      warehouseType: i.warehouseType,
      quantity: i.quantity,
      safetyStock: i.safetyStock,
      status: i.status,
    })),
    listing: p.listing
      ? {
          title: p.listing.title,
          bullets: toBullets(p.listing.bullets),
          description: p.listing.description,
          searchTerms: p.listing.searchTerms,
        }
      : null,
  };
}

export async function createProductGuarded(input: CreateProductInput) {
  if (!(await storeExists(input.storeId))) {
    throw bizError("店铺不存在", "STORE_NOT_FOUND");
  }
  if (await skuExistsInStore(input.storeId, input.sku)) {
    throw bizError("该店铺下 SKU 已存在", "SKU_EXISTS");
  }
  return createProduct(input);
}

export async function updateProductGuarded(id: string, input: UpdateProductInput) {
  const current = await findProductDetail(id);
  if (!current) {
    throw bizError("商品不存在", "PRODUCT_NOT_FOUND");
  }
  return updateProduct(id, input);
}

export async function deleteProduct(id: string) {
  const current = await findProductDetail(id);
  if (!current) {
    throw bizError("商品不存在", "PRODUCT_NOT_FOUND");
  }
  return softDeleteProduct(id);
}

