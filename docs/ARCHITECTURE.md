# 架构设计

## 总体
Next.js 15 单体同构（App Router）：
- 读路径：RSC 直连 Service → Repository → Prisma
- 写路径：Route Handler（zod 校验）→ Service → Repository
- 横切：Auth.js JWT 会话 + middleware 路由守卫 + RBAC 权限矩阵

## 分层
- `app/api/**`：Controller 层（参数校验、权限检查、错误结构）
- `services/**`：业务规则（登录校验、Dashboard 聚合、用户管理）
- `repositories/**`：数据访问（用户、角色查询）
- `lib/analytics.ts`：纯函数聚合（可单测，无 DB 依赖）

## 数据库（PostgreSQL + Prisma）
核心表：User/Role/Permission/UserRole/RolePermission（RBAC）、Store、Product、Listing、Inventory、InventoryMovement、Order、OrderItem、ProfitSnapshot。
索引：`(storeId, sku)` 唯一、`(productId, warehouseType)` 唯一、`(storeId, createdAt)` 订单列表、`(productId, date)` 快照唯一、`(storeId, date)` 财务聚合。

## 部署
- 开发：docker compose（Postgres 16）+ `pnpm dev`
- 迁移：`prisma migrate dev`（每个 migration 记录逆操作说明）

## 安全
- 密码 bcrypt(10)；会话 JWT（Auth.js 加密 cookie）
- middleware 拦截未登录；页面/API 双重权限校验
- 统一错误结构，不泄露堆栈
