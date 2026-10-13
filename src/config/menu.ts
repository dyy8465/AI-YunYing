import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Boxes,
  Megaphone,
  Wallet,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "数据驾驶舱", icon: LayoutDashboard, permission: "dashboard:view" },
  { href: "/stores", label: "店铺管理", icon: Store, permission: "stores:view", badge: "P0" },
  { href: "/products", label: "商品中心", icon: Package, permission: "products:view", badge: "P0" },
  { href: "/orders", label: "订单管理", icon: ShoppingCart, permission: "orders:view", badge: "P0" },
  { href: "/inventory", label: "库存管理", icon: Boxes, permission: "inventory:view", badge: "P0" },
  { href: "/advertising", label: "广告管理", icon: Megaphone, permission: "advertising:view", badge: "P1" },
  { href: "/finance", label: "财务利润", icon: Wallet, permission: "finance:view", badge: "P1" },
  { href: "/ai-assistant", label: "AI 助手", icon: Sparkles, permission: "ai:view", badge: "P1" },
  { href: "/users", label: "用户与角色", icon: Users, permission: "users:manage" },
];

export function filterNavItems(permissions: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => permissions.includes(item.permission));
}
