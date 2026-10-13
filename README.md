# Amazon Seller OS · 亚马逊跨境电商智能运营管理平台

生产级标准的全栈 SaaS 演示项目（模拟数据，未接真实 Amazon API）。

## 技术栈

- **前端**：Next.js 15 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui 风格组件 · Recharts · React Query
- **后端**：Next.js Route Handlers（Controller → Service → Repository 分层）
- **数据库**：PostgreSQL 16 + Prisma ORM
- **认证**：Auth.js (NextAuth v5) + JWT Session + Credentials
- **权限**：RBAC（用户-角色-权限，菜单/API/按钮三级）
- **测试**：Vitest
- **部署**：Docker Compose（Postgres）+ 应用

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动 PostgreSQL（需要 Docker）
docker compose up -d

# 3. 初始化数据库
pnpm db:migrate    # 首次会引导创建 migration
pnpm db:seed       # 写入模拟数据

# 4. 启动
pnpm dev
```

访问 http://localhost:3000

## 演示账号（密码均为 `Password123!`）

| 角色 | 邮箱 |
|------|------|
| 超级管理员 | admin@aso.dev |
| 企业老板 | owner@aso.dev |
| 运营人员 | operator@aso.dev |
| 仓库人员 | warehouse@aso.dev |
| 财务人员 | finance@aso.dev |

> 不同角色登录后看到的左侧菜单不同（RBAC 动态渲染）。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm build` / `pnpm start` | 生产构建 / 启动 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest 单元测试 |
| `pnpm db:migrate` | 迁移（开发） |
| `pnpm db:seed` | 重新生成模拟数据 |
| `pnpm db:studio` | Prisma Studio |

## 项目结构

```
src/
├── app/
│   ├── (auth)/login          # 登录页
│   ├── (dashboard)/          # 登录后主布局（侧边栏+顶栏）
│   │   ├── dashboard/        # 数据驾驶舱（P0）
│   │   ├── stores|products|orders|inventory/  # P0 模块（Phase 2-4 实现页面）
│   │   ├── advertising|finance|ai-assistant/   # P1 占位
│   │   └── users/            # 用户与角色管理（Admin）
│   └── api/                  # Route Handlers
├── components/               # ui / layout / features / dashboard
├── lib/                      # auth / rbac / analytics / api / prisma
├── services/                 # 业务逻辑
├── repositories/             # 数据访问
└── types/                    # 类型增强
```

## 开发路线

- [x] Phase 1 基础框架：登录 / RBAC / Dashboard
- [ ] Phase 2 店铺 + 商品管理
- [ ] Phase 3 订单管理
- [ ] Phase 4 库存管理
- [ ] Phase 5 财务分析
- [ ] Phase 6 AI 助手
- [ ] Phase 7 优化与部署
