# API 设计（Phase 1+）

约定：错误统一返回 `{ code, message, details? }`；鉴权走 Auth.js 会话 cookie。

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/health | 健康检查 | 无 |
| * | /api/auth/* | Auth.js（登录/登出/会话） | - |
| GET | /api/users | 用户列表 | users:manage |
| POST | /api/users | 创建用户（name/email/password/roleCode） | users:manage |
| PATCH | /api/users/:id/role | 修改角色（roleCode） | users:manage |
| GET | /api/orders | 订单列表（分页/筛选） | orders:view |
| GET | /api/orders/export | 导出订单 CSV | orders:view |
| GET | /api/finance | 财务利润总览（period=30/90/365，storeId 可选） | finance:view |
| GET | /api/finance/export | 导出 SKU 利润报表 CSV | finance:view |

错误码：VALIDATION_ERROR(422)、FORBIDDEN(403)、INTERNAL_ERROR(500)。
