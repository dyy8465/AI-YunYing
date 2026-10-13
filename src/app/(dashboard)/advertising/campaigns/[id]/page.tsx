import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCampaignById } from "@/services/ad.service";
import { pct } from "@/lib/ad-logic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdsTrendChart } from "@/components/features/advertising/ads-trend-chart";
import { CampaignActions } from "@/components/features/advertising/campaign-actions";
import { ArrowLeft, DollarSign, Target, TrendingUp, MousePointerClick } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = { SP: "商品推广", SB: "品牌推广", SD: "展示推广" };
const MATCH_LABELS: Record<string, string> = { EXACT: "精准", PHRASE: "词组", BROAD: "广泛" };

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.permissions.includes("advertising:view")) redirect("/403");

  const { id } = await params;
  const c = await getCampaignById(id);
  if (!c) notFound();

  const canManage = session.user.permissions.includes("advertising:manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/advertising"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{c.name}</h1>
              <Badge variant="outline">{c.type} {TYPE_LABELS[c.type]}</Badge>
              <Badge variant={c.status === "ENABLED" ? "default" : "secondary"}>
                {c.status === "ENABLED" ? "投放中" : "已暂停"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{c.storeName} · 日预算 ${c.dailyBudget.toFixed(2)}</p>
          </div>
        </div>
        {canManage && <CampaignActions campaignId={c.id} status={c.status} dailyBudget={c.dailyBudget} />}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>近 30 天花费</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums text-rose-600 dark:text-rose-400"><DollarSign className="h-4 w-4" />{c.totals.spend.toFixed(0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">CPC ${c.totals.cpc?.toFixed(2) ?? "-"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>广告销售额</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-4 w-4" />{c.totals.sales.toFixed(0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{c.totals.orders} 单</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ACOS</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums"><Target className="h-4 w-4 text-primary" />{pct(c.totals.acos, 1)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">ROAS {c.totals.roas?.toFixed(1) ?? "-"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>点击率 CTR</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums"><MousePointerClick className="h-4 w-4 text-primary" />{pct(c.totals.ctr, 2)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{c.totals.clicks.toLocaleString()} 点击 / {c.totals.impressions.toLocaleString()} 曝光</CardContent>
        </Card>
      </div>

      {c.suggestion && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-700 dark:text-amber-400">💡 优化建议</CardTitle>
            <CardDescription className="text-amber-700/80 dark:text-amber-400/80">{c.suggestion}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>30 天趋势</CardTitle>
            <CardDescription>每日花费 vs 销售额</CardDescription>
          </CardHeader>
          <CardContent><AdsTrendChart data={c.trend} /></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">关键词表现（近 30 天）</CardTitle>
            <CardDescription>按花费排序 · ACOS 红色预警</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>关键词</TableHead>
                  <TableHead>匹配</TableHead>
                  <TableHead className="text-right">花费/销售</TableHead>
                  <TableHead className="text-right">ACOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.keywords.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.keyword}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{MATCH_LABELS[k.matchType]}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      <span className="text-rose-600 dark:text-rose-400">${k.spend.toFixed(0)}</span>
                      {" / "}
                      <span className="text-emerald-600 dark:text-emerald-400">${k.sales.toFixed(0)}</span>
                    </TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${(k.acos ?? 0) > 0.4 ? "text-rose-600 dark:text-rose-400" : ""}`}>
                      {pct(k.acos, 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
