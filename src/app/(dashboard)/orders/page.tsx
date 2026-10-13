import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrders } from "@/services/order.service";
import { listStores } from "@/services/store.service";
import { orderQuerySchema } from "@/lib/validations/order";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderFilters } from "@/components/features/orders/order-filters";
import { ChevronLeft, ChevronRight, ShoppingCart, Clock, Truck, Undo2 } from "lucide-react";
import type { OrderStatus } from "@/lib/order-state";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PROCESSING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  SHIPPED: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  IN_TRANSIT: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  REFUNDED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user.permissions.includes("orders:view")) redirect("/403");

  const raw = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const query = orderQuerySchema.parse(raw);
  const [{ items, total, page, pageSize, summary }, stores] = await Promise.all([getOrders(query), listStores()]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.storeId) params.set("storeId", query.storeId);
    if (query.status) params.set("status", query.status);
    if (query.channel) params.set("channel", query.channel);
    params.set("page", String(p));
    return `/orders?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">订单管理</h1>
        <p className="text-sm text-muted-foreground">Amazon 订单 · 状态流转 · 导出与售后</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "订单总数（当前筛选）", value: summary.total.toLocaleString(), icon: ShoppingCart, tone: "bg-primary/10 text-primary" },
          { label: "待处理", value: summary.pending.toLocaleString(), icon: Clock, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
          { label: "在途", value: summary.shipped.toLocaleString(), icon: Truck, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          { label: "已退款", value: summary.refunded.toLocaleString(), icon: Undo2, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
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
          <OrderFilters stores={stores.map((s) => ({ id: s.id, name: s.name, site: s.site }))} />
          <span className="text-sm text-muted-foreground">共 {total.toLocaleString()} 笔订单</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>渠道 / 店铺</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>买家</TableHead>
                <TableHead>商品</TableHead>
                <TableHead className="text-right">金额</TableHead>
                <TableHead>下单时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    没有匹配的订单，试试调整筛选条件
                  </TableCell>
                </TableRow>
              )}
              {items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.amazonOrderId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-[10px]">{o.channel}</Badge>
                      <span>{o.storeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_TONES[o.status]}`}>{o.statusLabel}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{o.buyerMasked}</div>
                    <div className="text-xs text-muted-foreground">{o.buyerCity ?? "-"}</div>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-sm">
                    <div className="truncate">{o.itemTitles[0] ?? "-"}</div>
                    {o.itemCount > 1 && <div className="text-xs text-muted-foreground">等 {o.itemCount} 件商品</div>}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">${o.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">{fmtDate(o.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm"><Link href={`/orders/${o.id}`}>详情</Link></Button>
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
            {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page - 1)}><ChevronLeft className="h-4 w-4" />上一页</Link></Button>}
            {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={pageUrl(page + 1)}>下一页<ChevronRight className="h-4 w-4" /></Link></Button>}
          </div>
        </div>
      )}
    </div>
  );
}

