import { describe, expect, it } from "vitest";
import { createProductSchema, productQuerySchema, updateProductSchema } from "./product";

const validCreate = {
  storeId: "store-1",
  sku: "SKU-0001",
  asin: "B012345678",
  fnsku: "X012345678",
  title: "Wireless Earbuds Pro",
  category: "3C数码",
  brand: "AnkerStyle",
  costPrice: "12.5",
  salePrice: "29.99",
  weightGrams: "250",
} as const;

describe("createProductSchema", () => {
  it("接受合法输入（字符串数字自动转型）", () => {
    const parsed = createProductSchema.parse(validCreate);
    expect(parsed.costPrice).toBe(12.5);
    expect(parsed.status).toBe("ACTIVE"); // 默认值
  });

  it("拒绝非法类目", () => {
    const result = createProductSchema.safeParse({ ...validCreate, category: "未知类目" });
    expect(result.success).toBe(false);
  });

  it("拒绝含特殊字符的 SKU", () => {
    const result = createProductSchema.safeParse({ ...validCreate, sku: "SKU$001" });
    expect(result.success).toBe(false);
  });

  it("拒绝非正数价格", () => {
    const result = createProductSchema.safeParse({ ...validCreate, salePrice: "-1" });
    expect(result.success).toBe(false);
  });

  it("Listing 五点描述不足 3 条时拒绝", () => {
    const result = createProductSchema.safeParse({
      ...validCreate,
      listing: { title: "T", bullets: ["one", "two"], description: "0123456789", searchTerms: "" },
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("允许部分更新", () => {
    const parsed = updateProductSchema.parse({ salePrice: "39.99" });
    expect(parsed.salePrice).toBe(39.99);
    expect(parsed.title).toBeUndefined();
  });
});

describe("productQuerySchema", () => {
  it("page 默认为 1", () => {
    const parsed = productQuerySchema.parse({});
    expect(parsed.page).toBe(1);
  });

  it("拒绝非法页码", () => {
    expect(productQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
