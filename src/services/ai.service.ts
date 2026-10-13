import "server-only";
import { prisma } from "@/lib/prisma";
import { chatCompletion, chatCompletionStream, llmConfigured, type LlmMessage } from "@/lib/llm";
import { pct } from "@/lib/ad-logic";

const DAY_MS = 24 * 60 * 60 * 1000;

async function buildBusinessContext(): Promise<string> {
  const from30 = new Date(Date.now() - 29 * DAY_MS);
  const from60 = new Date(Date.now() - 59 * DAY_MS);

  const [snapshots, topItems, alerts, adMetrics] = await Promise.all([
    prisma.profitSnapshot.findMany({ where: { date: { gte: from30 } } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: from30 }, status: { in: ["SHIPPED", "IN_TRANSIT", "COMPLETED"] } } },
      _sum: { quantity: true },
    }),
    prisma.inventory.findMany({
      where: { quantity: { lt: prisma.inventory.fields.safetyStock } },
      include: { product: { select: { title: true, sku: true } } },
      orderBy: { quantity: "asc" },
      take: 8,
    }),
    prisma.adMetric.aggregate({
      where: { date: { gte: from30 } },
      _sum: { impressions: true, clicks: true, spend: true, sales: true, orders: true },
    }),
  ]);

  // 近 30 天 vs 前 30 天利润对比（归因用）
  const prevSnapshots = await prisma.profitSnapshot.findMany({
    where: { date: { gte: from60, lt: from30 } },
  });
  const sumBy = (rows: typeof snapshots, key: "revenue" | "productCost" | "commission" | "fbaFee" | "adSpend" | "logisticsCost" | "netProfit") =>
    Math.round(rows.reduce((s, r) => s + r[key].toNumber(), 0));

  const productIds = topItems.map((t) => t.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, sku: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const adSpend = adMetrics._sum.spend?.toNumber() ?? 0;
  const adSales = adMetrics._sum.sales?.toNumber() ?? 0;

  const ctx = {
    profitLast30d: {
      revenue: sumBy(snapshots, "revenue"),
      productCost: sumBy(snapshots, "productCost"),
      commission: sumBy(snapshots, "commission"),
      fbaFee: sumBy(snapshots, "fbaFee"),
      adSpend: sumBy(snapshots, "adSpend"),
      logisticsCost: sumBy(snapshots, "logisticsCost"),
      netProfit: sumBy(snapshots, "netProfit"),
    },
    profitPrev30d: {
      revenue: sumBy(prevSnapshots, "revenue"),
      adSpend: sumBy(prevSnapshots, "adSpend"),
      productCost: sumBy(prevSnapshots, "productCost"),
      netProfit: sumBy(prevSnapshots, "netProfit"),
    },
    topProductsByQty: topItems
      .sort((a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0))
      .slice(0, 5)
      .map((t) => ({
        sku: productMap.get(t.productId)?.sku ?? t.productId,
        title: productMap.get(t.productId)?.title ?? "未知商品",
        soldQty30d: t._sum.quantity ?? 0,
      })),
    lowStockAlerts: alerts.map((a) => ({
      sku: a.product.sku,
      title: a.product.title,
      warehouse: a.warehouseType,
      quantity: a.quantity,
      safetyStock: a.safetyStock,
    })),
    advertising30d: {
      spend: Math.round(adSpend),
      sales: Math.round(adSales),
      acos: pct(adSales > 0 ? adSpend / adSales : null, 1),
      clicks: adMetrics._sum.clicks ?? 0,
      impressions: adMetrics._sum.impressions ?? 0,
    },
  };

  return JSON.stringify(ctx, null, 1);
}

const SYSTEM_PROMPT = `你是「Amazon Seller OS」的 AI 运营助手，一位资深亚马逊跨境电商专家。

你会收到一份当前店铺经营数据的 JSON 上下文（近 30 天利润、销量排行、库存预警、广告指标等）。回答时：

1. 优先基于数据说话：引用具体数字（金额单位为美元）做归因和对比
2. 常见分析框架：利润下降 → 检查广告花费↑ / 转化率↓ / 商品成本↑ 三因子
3. 给出可执行建议时具体到 SKU、金额幅度和操作步骤
4. 数据中没有的信息就明说"数据中暂无"，不要编造
5. 用简体中文回答，使用 Markdown（适当加粗、列表、小标题），保持专业简洁`;

export async function aiChat(messages: LlmMessage[], temperature = 0.4) {
  if (!llmConfigured()) {
    throw Object.assign(new Error("AI 服务未配置（缺少 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL）"), { code: "LLM_NOT_CONFIGURED" });
  }
  const businessContext = await buildBusinessContext();
  const system = `${SYSTEM_PROMPT}\n\n## 当前经营数据\n\`\`\`json\n${businessContext}\n\`\`\``;
  return chatCompletion(system, messages, { temperature, maxTokens: 12000, timeoutMs: 120_000 });
}


/** 流式对话：逐 token 输出正文 */
export async function* aiChatStream(messages: LlmMessage[], temperature = 0.4) {
  if (!llmConfigured()) {
    throw Object.assign(new Error("AI 服务未配置（缺少 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL）"), { code: "LLM_NOT_CONFIGURED" });
  }
  const businessContext = await buildBusinessContext();
  const system = `${SYSTEM_PROMPT}\n\n## 当前经营数据\n\`\`\`json\n${businessContext}\n\`\`\``;
  yield* chatCompletionStream(system, messages, { temperature, maxTokens: 12000, timeoutMs: 280_000 });
}
