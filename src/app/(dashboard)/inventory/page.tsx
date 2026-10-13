import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventories } from "@/services/inventory.service";
import { listStores } from "@/services/store.service";
import { inventoryQuerySchema } from "@/lib/validations/inventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryFilters } from "@/components/features/inventory/inventory-filters";
import { ChevronLeft, ChevronRight, Boxes, Globe, Home, Warehouse, TriangleAlert } from "lucide-react";

export const dynamic = "force-dynamic";

const WAREHOUSE_LABELS: Record<string, string> = { FBA: "FBA 仓", OVERSEAS: "海外仓", DOMESTIC: "国内仓" };
const STATUS_META: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "正常", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  LOW_STOCK: { label: "库存预警", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  OUT_OF_STOCK_RISK: { label: "断货风险", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  SLOW_MOVING: { label: "滞销", tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user.permissions.includes("inventory:view")) redirect("/403");

  const raw = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const query = inventoryQuerySchema.parse(raw);
  const [{ items, total, page, pageSize, summary }, stores] = await Promise.all([getInventories(query), listStores()]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.storeId) params.set("storeId", query.storeId);
    if (query.warehouse) params.set("warehouse", query.warehouse);
    if (query.status) params.set("status", query.status);
    params.set("page", String(p));
    return `/inventory?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">库存管理</h1>
        <p className="text-sm text-muted-foreground">三仓总览 · 出入库调拨 · 预警与补货建议</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "FBA 仓总量", value: summary.fba.toLocaleString(), icon: Boxes, tone: "bg-primary/10 text-primary" },
          { label: "海外仓总量", value: summary.overseas.toLocaleString(), icon: Globe, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: "国内仓总量", value: summary.domestic.toLocaleString(), icon: Home, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          { label: "预警记录", value: summary.alerts.toLocaleString(), icon: TriangleAlert, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
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

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <InventoryFilters stores={stores.map((s) => ({ id: s.id, name: s.name, site: s.site }))} />
          <span className="text-sm text-muted-foreground">共 {total} 条库存记录</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品</TableHead>
                <TableHead>仓库</TableHead>
                <TableHead className="text-right">库存 / 安全库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">30 天销量</TableHead>
                <TableHead className="text-right">预计售罄</TableHead>
                <TableHead className="text-right">建议补货</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Warehouse className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    没有匹配的库存记录
                  </TableCell>
                </TableRow>
              )}
              {items.map((inv) => {
                const st = STATUS_META[inv.status] ?? STATUS_META.NORMAL!;
                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="max-w-[220px] truncate font-medium">{inv.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">{inv.sku} · {inv.storeName}</div>
                    </TableCell>
                    <TableCell><span className="text-sm">{WAREHOUSE_LABELS[inv.warehouse]}</span></TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={`font-medium ${inv.quantity === 0 ? "text-destructive" : inv.quantity < inv.safetyStock ? "text-amber-600 dark:text-amber-400" : ""}`}>
                        {inv.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground"> / {inv.safetyStock}</span>
                    </TableCell>
                    <TableCell><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{inv.sold30d}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {inv.daysOfCover === null ? <span className="text-muted-foreground">充裕</span> : `${inv.daysOfCover} 天`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {inv.suggestedQty > 0 ? (
                        <span className="font-medium text-primary">+{inv.suggestedQty}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm"><Link href={`/inventory/${inv.id}`}>详情</Link></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page - 1)}><ChevronLeft className="h-4 w-4" />上一页</Link></Button>}
            {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page + 1)}>下一页<ChevronRight className="h-4 w-4" /></Link></Button>}
          </div>
        </div>
      )}
    </div>
  );
}
