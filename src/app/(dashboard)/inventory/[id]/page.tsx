import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getInventoryById } from "@/services/inventory.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryActions } from "@/components/features/inventory/inventory-actions";
import { ArrowLeft, Package, ShieldCheck, TrendingUp, Timer } from "lucide-react";

export const dynamic = "force-dynamic";

const WAREHOUSE_LABELS: Record<string, string> = { FBA: "FBA 仓", OVERSEAS: "海外仓", DOMESTIC: "国内仓" };
const STATUS_META: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "正常", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  LOW_STOCK: { label: "库存预警", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  OUT_OF_STOCK_RISK: { label: "断货风险", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  SLOW_MOVING: { label: "滞销", tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};
const MOVEMENT_META: Record<string, { label: string; tone: string }> = {
  IN: { label: "入库", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  OUT: { label: "出库", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  TRANSFER: { label: "调拨", tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.permissions.includes("inventory:view")) redirect("/403");

  const { id } = await params;
  const inv = await getInventoryById(id);
  if (!inv) notFound();

  const canManage = session.user.permissions.includes("inventory:manage");
  const st = STATUS_META[inv.status] ?? STATUS_META.NORMAL!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link href="/inventory"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{inv.title}</h1>
            <Badge variant="outline">{WAREHOUSE_LABELS[inv.warehouse]}</Badge>
            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${st.tone}`}>{st.label}</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {inv.sku} · {inv.asin} · {inv.storeName}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>当前库存</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums"><Package className="h-4 w-4 text-primary" />{inv.quantity}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">安全库存 {inv.safetyStock}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>近 30 天销量</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums"><TrendingUp className="h-4 w-4 text-primary" />{Math.round(inv.restock.velocity * 30)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">日均 {inv.restock.velocity} 件</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>预计售罄</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums">
              <Timer className="h-4 w-4 text-primary" />
              {inv.restock.daysOfCover === null ? "充裕" : `${inv.restock.daysOfCover} 天`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">按当前销量估算</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>建议补货</CardDescription>
            <CardTitle className="flex items-center gap-1.5 text-2xl tabular-nums">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {inv.restock.suggestedQty > 0 ? `+${inv.restock.suggestedQty}` : "无需"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">补齐 60 天覆盖</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        {canManage ? (
          <InventoryActions inventoryId={inv.id} currentWarehouse={inv.warehouse} currentSafetyStock={inv.safetyStock} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">库存操作</CardTitle>
              <CardDescription>当前角色只读，操作需要仓库或管理员权限</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">库存流水（最近 20 条）</CardTitle>
            <CardDescription>每笔出入库与调拨均留痕</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>关联单号</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inv.movements.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">暂无流水</TableCell></TableRow>
                )}
                {inv.movements.map((m) => {
                  const meta = MOVEMENT_META[m.type] ?? MOVEMENT_META.IN!;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">{fmtDateTime(m.createdAt)}</TableCell>
                      <TableCell><span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${meta.tone}`}>{meta.label}</span></TableCell>
                      <TableCell className="text-right font-medium tabular-nums">× {m.quantity}</TableCell>
                      <TableCell className="font-mono text-xs">{m.reference ?? "-"}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">{m.note ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
