import "server-only";
import { computeMetrics, suggestOptimization, type MetricInput } from "@/lib/ad-logic";
import {
  createCampaign,
  findCampaignDetail,
  getAdvertisingTotals,
  getTrend30d,
  searchCampaigns,
  storeIdExists,
  updateCampaign,
} from "@/repositories/ad.repository";
import type { CampaignQuery, CreateCampaignInput, UpdateCampaignInput } from "@/lib/validations/advertising";

function bizError(message: string, code: string) {
  return Object.assign(new Error(message), { code });
}

function sumToMetricInput(sum: {
  impressions: number; clicks: number; spend: unknown; sales: unknown; orders: number;
}): MetricInput {
  return {
    impressions: sum.impressions,
    clicks: sum.clicks,
    orders: sum.orders,
    spend: Number(sum.spend ?? 0),
    sales: Number(sum.sales ?? 0),
  };
}

export async function getCampaigns(query: CampaignQuery) {
  const [{ rows, total, page, pageSize }, totals, trend] = await Promise.all([
    searchCampaigns(query),
    getAdvertisingTotals(query.storeId),
    getTrend30d(query.storeId),
  ]);

  const items = rows.map((c) => {
    const input = sumToMetricInput({
      impressions: c.metrics.reduce((s, m) => s + m.impressions, 0),
      clicks: c.metrics.reduce((s, m) => s + m.clicks, 0),
      spend: c.metrics.reduce((s, m) => s + m.spend.toNumber(), 0),
      sales: c.metrics.reduce((s, m) => s + m.sales.toNumber(), 0),
      orders: c.metrics.reduce((s, m) => s + m.orders, 0),
    });
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      dailyBudget: c.dailyBudget.toNumber(),
      storeName: c.store.name,
      keywordCount: c._count.keywords,
      ...input,
      ctr: computeMetrics(input).ctr,
      cpc: computeMetrics(input).cpc,
      acos: computeMetrics(input).acos,
      roas: computeMetrics(input).roas,
      suggestion: suggestOptimization(input),
    };
  });

  const summaryMetrics = sumToMetricInput(totals);
  return {
    items,
    total,
    page,
    pageSize,
    summary: { ...summaryMetrics, ...computeMetrics(summaryMetrics) },
    trend,
  };
}

export async function getCampaignById(id: string) {
  const c = await findCampaignDetail(id);
  if (!c) return null;

  const input = sumToMetricInput({
    impressions: c.metrics.reduce((s, m) => s + m.impressions, 0),
    clicks: c.metrics.reduce((s, m) => s + m.clicks, 0),
    spend: c.metrics.reduce((s, m) => s + m.spend.toNumber(), 0),
    sales: c.metrics.reduce((s, m) => s + m.sales.toNumber(), 0),
    orders: c.metrics.reduce((s, m) => s + m.orders, 0),
  });

  return {
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    dailyBudget: c.dailyBudget.toNumber(),
    storeName: c.store.name,
    storeSite: c.store.site,
    totals: { ...input, ...computeMetrics(input) },
    suggestion: suggestOptimization(input),
    trend: c.metrics.map((m) => ({
      date: m.date.toISOString().slice(0, 10),
      spend: m.spend.toNumber(),
      sales: m.sales.toNumber(),
    })),
    keywords: c.keywords.map((k) => {
      const ki: MetricInput = {
        impressions: k.impressions,
        clicks: k.clicks,
        spend: k.spend.toNumber(),
        sales: k.sales.toNumber(),
        orders: 0,
      };
      const km = computeMetrics(ki);
      return {
        id: k.id,
        keyword: k.keyword,
        matchType: k.matchType,
        ...ki,
        ctr: km.ctr,
        cpc: km.cpc,
        acos: km.acos,
        roas: km.roas,
      };
    }),
  };
}

export async function createCampaignGuarded(input: CreateCampaignInput) {
  if (!(await storeIdExists(input.storeId))) {
    throw bizError("店铺不存在", "STORE_NOT_FOUND");
  }
  return createCampaign(input);
}

export async function updateCampaignGuarded(id: string, input: UpdateCampaignInput) {
  const current = await findCampaignDetail(id);
  if (!current) throw bizError("广告活动不存在", "CAMPAIGN_NOT_FOUND");
  return updateCampaign(id, input);
}

