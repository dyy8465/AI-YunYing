import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampaigns } from "@/services/ad.service";
import { listStores } from "@/services/store.service";
import { campaignQuerySchema } from "@/lib/validations/advertising";
import { pct } from "@/lib/ad-logic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdvertisingFilters } from "@/components/features/advertising/advertising-filters";
import { CampaignForm } from "@/components/features/advertising/campaign-form";
import { AdsTrendChart } from "@/components/features/advertising/ads-trend-chart";
import { Megaphone, DollarSign, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = { SP: "商品推广", SB: "品牌推广", SD: "展示推广" };

export default async function AdvertisingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user.permissions.includes("advertising:view")) redirect("/403");

  const raw = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const query = campaignQuerySchema.parse(raw);
  const [{ items, total, page, pageSize, summary, trend }, stores] = await Promise.all([getCampaigns(query), listStores()]);
  const canManage = session.user.permissions.includes("advertising:manage");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.storeId) params.set("storeId", query.storeId);
    if (query.type) params.set("type", query.type);
    if (query.status) params.set("status", query.status);
    params.set("page", String(p));
    return `/advertising?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">广告管理</h1>
        <p className="text-sm text-muted-foreground">SP / SB / SD 广告活动 · 关键词分析 · 自动优化建议</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "近 30 天花费", value: `$${summary.spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: DollarSign, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
          { label: "广告销售额", value: `$${summary.sales.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "ACOS", value: pct(summary.acos, 1), icon: Target, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          { label: "ROAS", value: summary.roas?.toFixed(2) ?? "-", icon: Megaphone, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
        ].map((k) => (
          <Card key={k.label} className="card-hover">
            <CardHeader className="pb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}><k.icon className="h-4.5 w-4.5" /></div>
              <CardDescription className="mt-2 text-xs">{k.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>广告趋势</CardTitle>
              <CardDescription>近 30 天花费 vs 销售额</CardDescription>
            </CardHeader>
            <CardContent><AdsTrendChart data={trend} /></CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <AdvertisingFilters stores={stores.map((s) => ({ id: s.id, name: s.name, site: s.site }))} />
              <span className="text-sm text-muted-foreground">共 {total} 个活动</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>活动</TableHead>
                    <TableHead>类型 / 状态</TableHead>
                    <TableHead className="text-right">花费 / 销售</TableHead>
                    <TableHead className="text-right">ACOS</TableHead>
                    <TableHead className="text-right">ROAS / CTR</TableHead>
                    <TableHead>优化建议</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">暂无广告活动</TableCell></TableRow>
                  )}
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="max-w-[200px] truncate font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.storeName} · {c.keywordCount} 关键词</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit text-[10px]">{c.type} {TYPE_LABELS[c.type]}</Badge>
                          <Badge variant={c.status === "ENABLED" ? "default" : "secondary"} className="w-fit text-[10px]">
                            {c.status === "ENABLED" ? "投放中" : "已暂停"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="text-rose-600 dark:text-rose-400">${c.spend.toFixed(0)}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">${c.sales.toFixed(0)}</div>
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${(c.acos ?? 0) > 0.4 ? "text-rose-600 dark:text-rose-400" : ""}`}>
                        {pct(c.acos, 1)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div>{c.roas?.toFixed(1) ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{pct(c.ctr, 2)}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {c.suggestion ? (
                          <span className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">💡 {c.suggestion}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">表现正常</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/advertising/campaigns/${c.id}`}>详情</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
              <div className="flex gap-2">
                {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page - 1)}>上一页</Link></Button>}
                {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page + 1)}>下一页</Link></Button>}
              </div>
            </div>
          )}
        </div>

        {canManage && <CampaignForm stores={stores.map((s) => ({ id: s.id, name: s.name, site: s.site }))} />}
      </div>
    </div>
  );
}

