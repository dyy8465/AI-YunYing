import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/services/order.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderTransition } from "@/components/features/orders/order-transition";
import { ArrowLeft, Store, User, Clock, Truck, DollarSign, Package } from "lucide-react";

export const dynamic = "force-dynamic";

function fmtDateTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.permissions.includes("orders:view")) redirect("/403");

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const canManage = session.user.permissions.includes("orders:manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold">{order.amazonOrderId}</h1>
              <Badge variant="outline">{order.channel}</Badge>
              <Badge variant={order.status === "REFUNDED" ? "destructive" : order.status === "COMPLETED" ? "default" : "secondary"}>
                {order.statusLabel}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">下单于 {fmtDateTime(order.createdAt)}</p>
          </div>
        </div>
        {canManage && <OrderTransition orderId={order.id} current={order.status} />}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>订单金额</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums"><DollarSign className="h-4 w-4 text-primary" />{order.totalAmount.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{order.currency}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>所属店铺</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-base"><Store className="h-4 w-4 text-primary" />{order.storeName}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{order.channel} 渠道订单</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>买家（脱敏）</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-base"><User className="h-4 w-4 text-primary" />{order.buyerMasked}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{order.buyerCity ?? "-"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>发货时间</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-base"><Truck className="h-4 w-4 text-primary" />{order.shippedAt ? fmtDateTime(order.shippedAt).slice(5) : "未发货"}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{order.itemCount} 件商品</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4" />订单明细</CardTitle>
          <CardDescription>{order.items.length} 个 SKU · 合计 {order.itemCount} 件</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">小计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">
                    <Link href={`/products/${item.productId}`} className="hover:text-primary">{item.title}</Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">× {item.quantity}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">${item.subtotal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right text-sm text-muted-foreground">订单合计</TableCell>
                <TableCell className="text-right font-bold tabular-nums">${order.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
