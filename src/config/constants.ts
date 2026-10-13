export const PRODUCT_CATEGORIES = ["3C数码", "家居厨房", "户外运动", "办公文具", "手机配件"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PAGE_SIZE = 12;
