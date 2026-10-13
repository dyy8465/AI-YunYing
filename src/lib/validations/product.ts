import { z } from "zod";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from "@/config/constants";

const codeField = (label: string) =>
  z.string().min(4, `${label}至少 4 位`).max(30).regex(/^[A-Za-z0-9-]+$/, `${label}只能包含字母、数字、连字符`);

export const listingSchema = z.object({
  title: z.string().min(2, "Listing 标题至少 2 字").max(300),
  bullets: z.array(z.string().min(1).max(200)).min(3, "至少 3 条五点描述").max(5, "最多 5 条五点描述"),
  description: z.string().min(10, "产品描述至少 10 字").max(3000),
  searchTerms: z.string().max(500).default(""),
});

export const createProductSchema = z.object({
  storeId: z.string().min(1, "请选择店铺"),
  sku: codeField("SKU"),
  asin: codeField("ASIN"),
  fnsku: codeField("FNSKU"),
  title: z.string().min(2, "商品标题至少 2 字").max(200),
  category: z.enum(PRODUCT_CATEGORIES, { message: "类目不合法" }),
  brand: z.string().min(1, "品牌不能为空").max(60),
  costPrice: z.coerce.number().positive("成本价必须大于 0").max(100000),
  salePrice: z.coerce.number().positive("售价必须大于 0").max(100000),
  weightGrams: z.coerce.number().int("重量必须是整数").positive().max(1000000),
  lengthMm: z.coerce.number().int().positive().max(10000).optional(),
  widthMm: z.coerce.number().int().positive().max(10000).optional(),
  heightMm: z.coerce.number().int().positive().max(10000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(PRODUCT_STATUSES).default("ACTIVE"),
  listing: listingSchema.optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  brand: z.string().min(1).max(60).optional(),
  costPrice: z.coerce.number().positive().max(100000).optional(),
  salePrice: z.coerce.number().positive().max(100000).optional(),
  weightGrams: z.coerce.number().int().positive().max(1000000).optional(),
  lengthMm: z.coerce.number().int().positive().max(10000).optional(),
  widthMm: z.coerce.number().int().positive().max(10000).optional(),
  heightMm: z.coerce.number().int().positive().max(10000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(PRODUCT_STATUSES).optional(),
  listing: listingSchema.optional(),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  storeId: z.string().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  page: z.coerce.number().int().positive().max(1000).default(1),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
