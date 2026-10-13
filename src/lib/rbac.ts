export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  STORES_VIEW: "stores:view",
  STORES_MANAGE: "stores:manage",
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_MANAGE: "products:manage",
  ORDERS_VIEW: "orders:view",
  ORDERS_MANAGE: "orders:manage",
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_MANAGE: "inventory:manage",
  ADVERTISING_VIEW: "advertising:view",
  ADVERTISING_MANAGE: "advertising:manage",
  FINANCE_VIEW: "finance:view",
  AI_VIEW: "ai:view",
  USERS_MANAGE: "users:manage",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}

export function hasAnyPermission(permissions: string[], codes: string[]): boolean {
  return codes.some((c) => permissions.includes(c));
}
