# PRD · Amazon Seller OS v0.1

## 产品定位
面向中小亚马逊卖家的一站式智能运营管理 SaaS：整合商品、订单、库存、广告、财务，AI 辅助经营决策。MVP 使用模拟数据，预留 DataProvider 接口对接真实 SP-API。

## 用户角色（RBAC）
| 角色 | 定位 | 关键权限 |
|------|------|----------|
| ADMIN 超级管理员 | 系统管理 | 全部（用户/角色/配置/全部数据） |
| OWNER 企业老板 | 经营决策 | Dashboard、财务、各模块只读 |
| OPERATOR 运营 | 日常运营 | 商品/订单/广告管理 + AI |
| WAREHOUSE 仓库 | 库存操作 | 仅库存模块 |
| FINANCE 财务 | 核算对账 | Dashboard、订单金额、财务 |

## 功能分级
- **P0（Phase 1-4）**：登录/权限/Dashboard、店铺、商品、库存、订单
- **P1（Phase 5-6）**：广告分析、财务利润、AI 助手（规则引擎）
- **P2（Phase 7+）**：供应链、AI Listing（LLM）、真实 SP-API、多租户

## 核心流程
1. Admin 创建店铺与用户 → 绑定角色
2. 数据源（MVP: seed 模拟 / P2: SP-API 同步）→ 商品/订单/库存/快照
3. 各角色登录 → 菜单按权限动态渲染 → Dashboard 聚合展示

## 非功能需求
- TypeScript strict、模块化分层、统一错误结构 `{ code, message, details? }`
- 金额 Decimal(12,4)、时间 timestamptz、核心数据软删除
- 每阶段通过 typecheck/lint/test/build 四道门禁
