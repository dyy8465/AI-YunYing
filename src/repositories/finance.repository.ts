import { prisma } from "@/lib/prisma";

/** 查询利润快照（联商品信息），时间窗口由调用方决定 */
export function findProfitSnapshots(from: Date, storeId: string | "all") {
  return prisma.profitSnapshot.findMany({
    where: {
      date: { gte: from },
      ...(storeId === "all" ? {} : { storeId }),
    },
    include: {
      product: { select: { sku: true, title: true } },
    },
    orderBy: { date: "asc" },
  });
}
