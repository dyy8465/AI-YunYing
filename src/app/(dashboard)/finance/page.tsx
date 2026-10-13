import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFinanceOverview } from "@/services/finance.service";
import {
  FINANCE_PERIODS,
  FINANCE_PERIOD_LABELS,
  financeQuerySchema,
  type FinancePeriod,
} from "@/lib/validations/finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CostBreakdownChart, MonthlyProfitChart } from "@/components/finance/charts";
import { FinanceExportButton } from "@/components/finance/export-button";
import { DollarSign, Receipt, Megaphone, Wallet, Percent, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fmtUSD(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user.permissions.includes("finance:view")) redirect("/403");

  const cookieStore = await cookies();
  const storeId = cookieStore.get("storeId")?.value ?? "all";
  const params = await searchParams;
  const query = financeQuerySchema.parse({
    storeId,
    period: FINANCE_PERIODS.includes(params.period as FinancePeriod)
      ? params.period
      : undefined,
  });
  const data = await getFinanceOverview(query);

  const kpis = [
    {
      label: "总收入",
      value: fmtUSD(data.summary.revenue),
      icon: DollarSign,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      hint: "统计周期内销售收入",
    },
    {
      label: "总成本",
      value: fmtUSD(data.summary.totalCost),
      icon: Receipt,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      hint: `占收入 ${fmtPct(data.summary.revenue > 0 ? (data.summary.totalCost / data.summary.revenue) * 100 : 0)}`,
    },
    {
      label: "广告费用",
      value: fmtUSD(data.summary.adSpend),
      icon: Megaphone,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      hint: `ACOS ${fmtPct(data.summary.adRatio)}`,
    },
    {
      label: "净利润",
      value: fmtUSD(data.summary.netProfit),
      icon: Wallet,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      hint: "收入 - 全部成本",
    },
    {
      label: "净利率",
      value: fmtPct(data.summary.margin),
      icon: Percent,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      hint: "净利润 / 总收入",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">财务利润</h1>
          <p className="text-sm text-muted-foreground">SKU 利润分析、成本结构与月度财务趋势</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <CalendarDays className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {FINANCE_PERIODS.map((p) => (
              <Button
                key={p}
                asChild
                variant={p === query.period ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
              >
                <Link href={`/finance?period=${p}`} replace>
                  {FINANCE_PERIOD_LABELS[p]}
                </Link>
              </Button>
            ))}
          </div>
          <FinanceExportButton period={query.period} storeId={storeId} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="card-hover">
            <CardHeader className="pb-2">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", k.tone)}>
                <k.icon className="h-4.5 w-4.5" />
              </div>
              <CardDescription className="mt-2 text-xs">{k.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{k.hint}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>月度利润趋势</CardTitle>
            <CardDescription>近 6 个月收入与净利润对比</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyProfitChart data={data.monthlyTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>成本结构</CardTitle>
            <CardDescription>{FINANCE_PERIOD_LABELS[query.period]} · 按利润快照聚合</CardDescription>
          </CardHeader>
          <CardContent>
            <CostBreakdownChart data={data.costBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>SKU 利润分析</CardTitle>
              <CardDescription className="mt-1">
                {FINANCE_PERIOD_LABELS[query.period]} · 按净利润降序，共 {data.skuRows.length} 个 SKU
              </CardDescription>
            </div>
            <Badge variant={data.summary.netProfit >= 0 ? "default" : "destructive"} className="text-xs">
              净利润 {fmtUSD(data.summary.netProfit)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">SKU / 商品</TableHead>
                <TableHead className="text-right">收入</TableHead>
                <TableHead className="text-right">商品成本</TableHead>
                <TableHead className="text-right">佣金</TableHead>
                <TableHead className="text-right">FBA</TableHead>
                <TableHead className="text-right">广告</TableHead>
                <TableHead className="text-right">物流</TableHead>
                <TableHead className="text-right">净利润</TableHead>
                <TableHead className="text-right">净利率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.skuRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    当前筛选条件下暂无利润数据
                  </TableCell>
                </TableRow>
              ) : (
                data.skuRows.map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell>
                      <div className="font-medium">{r.sku}</div>
                      <div className="max-w-[220px] truncate text-xs text-muted-foreground" title={r.title}>
                        {r.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtUSD(r.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(r.productCost)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(r.commission)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(r.fbaFee)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(r.adSpend)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtUSD(r.logisticsCost)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        r.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {fmtUSD(r.netProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.margin >= 0 ? "secondary" : "destructive"} className="tabular-nums">
                        {fmtPct(r.margin)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
