import { describe, expect, it } from "vitest";
import { createStoreSchema, updateStoreSchema } from "./store";

describe("createStoreSchema", () => {
  it("接受合法输入并应用默认币种", () => {
    const parsed = createStoreSchema.parse({
      name: "America Star Store",
      site: "US",
      marketplaceId: "ATVPDKIKX0DER",
      sellerId: "A1USSELLER001",
    });
    expect(parsed.currency).toBe("USD");
  });

  it("拒绝非法站点", () => {
    const result = createStoreSchema.safeParse({
      name: "X", site: "XX", marketplaceId: "ATVPDKIKX0DER", sellerId: "A123456789",
    });
    expect(result.success).toBe(false);
  });

  it("拒绝包含特殊字符的 Seller ID", () => {
    const result = createStoreSchema.safeParse({
      name: "X", site: "US", marketplaceId: "ATVPDKIKX0DER", sellerId: "A1$ELLER!",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateStoreSchema", () => {
  it("允许部分更新", () => {
    const parsed = updateStoreSchema.parse({ apiStatus: "DISCONNECTED" });
    expect(parsed.apiStatus).toBe("DISCONNECTED");
    expect(parsed.name).toBeUndefined();
  });

  it("拒绝未知状态值", () => {
    expect(updateStoreSchema.safeParse({ apiStatus: "BROKEN" }).success).toBe(false);
  });
});
