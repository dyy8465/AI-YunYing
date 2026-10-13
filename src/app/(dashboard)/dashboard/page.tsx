import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/services/dashboard.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SalesTrendChart, TopProductsChart, SiteDistributionChart, ProfitTrendChart } from "@/components/dashboard/charts";
import { DollarSign, ShoppingCart, Package, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fmtUSD(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function TrendBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
      up ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    )}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(delta)}%
    </span>
  );
}

const COST_COLORS = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-slate-400"];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.permissions.includes("dashboard:view")) redirect("/403");

  const cookieStore = await cookies();
  const storeId = cookieStore.get("storeId")?.value ?? "all";
  const data = await getDashboardData(storeId);

  const kpis = [
    { label: "今日销售额", value: fmtUSD(data.kpi.todaySales), icon: DollarSign, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", hint: "实时更新" },
    { label: "本周销售额", value: fmtUSD(data.kpi.weekSales), icon: TrendingUp, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400", hint: "近 7 天", trend: data.kpi.weekDelta },
    { label: "本月销售额", value: fmtUSD(data.kpi.monthSales), icon: CalendarDays, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400", hint: "自然月" },
    { label: "本月订单数", value: data.kpi.orderCount.toLocaleString(), icon: ShoppingCart, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", hint: "已支付订单" },
    { label: "在售商品", value: String(data.kpi.productCount), icon: Package, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400", hint: "ACTIVE 状态" },
  ];

  const costItems = [
    { label: "总收入", value: data.profit.revenue, isTotal: true },
    { label: "商品成本", value: data.profit.productCost },
    { label: "平台佣金", value: data.profit.commission },
    { label: "FBA 费用", value: data.profit.fbaFee },
    { label: "广告费用", value: data.profit.adSpend },
    { label: "物流费用", value: data.profit.logisticsCost },
  ];

  const today = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数据驾驶舱</h1>
          <p className="text-sm text-muted-foreground">销售、利润与运营核心指标总览</p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-normal text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {today}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}>
                  <k.icon className="h-4.5 w-4.5" />
                </div>
                {typeof k.trend === "number" && <TrendBadge delta={k.trend} />}
              </div>
              <CardDescription className="mt-2 text-xs">{k.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{k.hint}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                利润概览
              </CardTitle>
              <CardDescription className="mt-1">近 30 天 · 按利润快照聚合</CardDescription>
            </div>
            <Badge variant={data.profit.netProfit >= 0 ? "default" : "destructive"} className="text-xs">
              净利润 {fmtUSD(data.profit.netProfit)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {costItems.map((item, i) => {
              const ratio = item.isTotal || data.profit.revenue === 0
                ? 100
                : Math.min(100, Math.round((item.value / data.profit.revenue) * 100));
              return (
                <div key={item.label} className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("font-medium", item.isTotal && "text-base font-semibold")}>{item.label}</span>
                    <span className={cn("tabular-nums text-muted-foreground", item.isTotal && "text-base font-semibold text-foreground")}>
                      {fmtUSD(item.value)}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", item.isTotal ? "bg-primary" : COST_COLORS[i % COST_COLORS.length])}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  {!item.isTotal && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground">占收入 {ratio}%</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>销售趋势</CardTitle>
            <CardDescription>近 30 天销售额走势</CardDescription>
          </CardHeader>
          <CardContent><SalesTrendChart data={data.salesTrend} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>利润趋势</CardTitle>
            <CardDescription>近 30 天净利润走势</CardDescription>
          </CardHeader>
          <CardContent><ProfitTrendChart data={data.profitTrend} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>商品销量 TOP8</CardTitle>
            <CardDescription>近 30 天按销量排序</CardDescription>
          </CardHeader>
          <CardContent><TopProductsChart data={data.topProducts} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>站点销售分布</CardTitle>
            <CardDescription>按店铺站点统计（近 90 天）</CardDescription>
          </CardHeader>
          <CardContent><SiteDistributionChart data={data.siteDistribution} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
