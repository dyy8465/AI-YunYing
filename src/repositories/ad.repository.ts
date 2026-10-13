import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CampaignQuery, CreateCampaignInput, UpdateCampaignInput } from "@/lib/validations/advertising";

const DAY_MS = 24 * 60 * 60 * 1000;

export function from30d(): Date {
  return new Date(Date.now() - 29 * DAY_MS);
}

export function buildCampaignWhere(query: CampaignQuery): Prisma.AdCampaignWhereInput {
  return {
    ...(query.storeId && query.storeId !== "all" ? { storeId: query.storeId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {}),
  };
}

export async function searchCampaigns(query: CampaignQuery) {
  const where = buildCampaignWhere(query);
  const [rows, total] = await Promise.all([
    prisma.adCampaign.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (query.page - 1) * 12,
      take: 12,
      include: {
        store: { select: { name: true, site: true } },
        metrics: {
          where: { date: { gte: from30d() } },
          select: { impressions: true, clicks: true, spend: true, sales: true, orders: true },
        },
        _count: { select: { keywords: true } },
      },
    }),
    prisma.adCampaign.count({ where }),
  ]);
  return { rows, total, page: query.page, pageSize: 12 };
}

export async function getAdvertisingTotals(storeId?: string) {
  const metrics = await prisma.adMetric.aggregate({
    where: {
      date: { gte: from30d() },
      campaign: storeId && storeId !== "all" ? { storeId } : undefined,
    },
    _sum: { impressions: true, clicks: true, spend: true, sales: true, orders: true },
  });
  return {
    impressions: metrics._sum.impressions ?? 0,
    clicks: metrics._sum.clicks ?? 0,
    spend: metrics._sum.spend?.toNumber() ?? 0,
    sales: metrics._sum.sales?.toNumber() ?? 0,
    orders: metrics._sum.orders ?? 0,
  };
}

export async function getTrend30d(storeId?: string) {
  const from = from30d();
  const grouped = await prisma.adMetric.groupBy({
    by: ["date"],
    where: {
      date: { gte: from },
      campaign: storeId && storeId !== "all" ? { storeId } : undefined,
    },
    _sum: { spend: true, sales: true },
    orderBy: { date: "asc" },
  });
  return grouped.map((g) => ({
    date: g.date.toISOString().slice(0, 10),
    spend: g._sum.spend?.toNumber() ?? 0,
    sales: g._sum.sales?.toNumber() ?? 0,
  }));
}

export async function findCampaignDetail(id: string) {
  return prisma.adCampaign.findFirst({
    where: { id },
    include: {
      store: { select: { id: true, name: true, site: true } },
      metrics: { where: { date: { gte: from30d() } }, orderBy: { date: "asc" } },
      keywords: { orderBy: { spend: "desc" } },
    },
  });
}

export async function storeIdExists(storeId: string) {
  const found = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  return found !== null;
}

export async function createCampaign(data: CreateCampaignInput) {
  return prisma.adCampaign.create({ data });
}

export async function updateCampaign(id: string, data: UpdateCampaignInput) {
  return prisma.adCampaign.update({ where: { id }, data });
}

