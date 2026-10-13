import { describe, expect, it } from "vitest";
import { hasAnyPermission, hasPermission } from "@/lib/rbac";
import { filterNavItems } from "@/config/menu";

describe("hasPermission", () => {
  it("拥有权限时返回 true", () => {
    expect(hasPermission(["dashboard:view"], "dashboard:view")).toBe(true);
  });

  it("无权限时返回 false", () => {
    expect(hasPermission(["dashboard:view"], "users:manage")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("任一匹配即通过", () => {
    expect(hasAnyPermission(["orders:view"], ["orders:manage", "orders:view"])).toBe(true);
  });
});

describe("filterNavItems（按角色过滤菜单）", () => {
  it("仓库人员只看到库存菜单", () => {
    const items = filterNavItems(["inventory:view", "inventory:manage"]);
    expect(items.map((i) => i.href)).toEqual(["/inventory"]);
  });

  it("管理员看到全部菜单", () => {
    const allPermissions = [
      "dashboard:view", "stores:view", "products:view", "orders:view", "inventory:view",
      "advertising:view", "finance:view", "ai:view", "users:manage",
    ];
    expect(filterNavItems(allPermissions).length).toBe(9);
  });
});
