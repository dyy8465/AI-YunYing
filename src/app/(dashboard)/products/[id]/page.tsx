import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProductById } from "@/services/product.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/features/products/product-form";
import { DeleteProductButton } from "@/components/features/products/delete-product-button";
import { ArrowLeft, Package, Warehouse } from "lucide-react";

export const dynamic = "force-dynamic";

const WAREHOUSE_NAMES: Record<string, string> = { FBA: "FBA 仓", OVERSEAS: "海外仓", DOMESTIC: "国内仓" };
const INVENTORY_STATUS: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "正常", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  LOW_STOCK: { label: "库存预警", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  OUT_OF_STOCK_RISK: { label: "断货风险", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  SLOW_MOVING: { label: "滞销", tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.permissions.includes("products:view")) redirect("/403");

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const canManage = session.user.permissions.includes("products:manage");
  const margin = product.salePrice > 0 ? Math.round(((product.salePrice - product.costPrice) / product.salePrice) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link href="/products"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{product.title}</h1>
              <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                {product.status === "ACTIVE" ? "在售" : "停售"}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {product.sku} · {product.asin} · {product.fnsku} · {product.storeName}
            </p>
          </div>
        </div>
        {canManage && <DeleteProductButton productId={product.id} title={product.title} />}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>销售价</CardDescription>
            <CardTitle className="text-2xl tabular-nums">${product.salePrice.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">成本 ${product.costPrice.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>毛利率</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{margin}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">售价 − 采购成本</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>FBA 库存</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{product.fbaQty}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">实时数量</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>重量 / 尺寸</CardDescription>
            <CardTitle className="text-lg tabular-nums">{product.weightGrams}g</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground tabular-nums">
            {product.lengthMm ?? "-"} × {product.widthMm ?? "-"} × {product.heightMm ?? "-"} mm
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Warehouse className="h-4 w-4" />库存分布</CardTitle>
          <CardDescription>三仓库存与安全库存对照</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {product.inventories.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" />暂无库存记录</p>
          )}
          {product.inventories.map((inv) => {
            const st = INVENTORY_STATUS[inv.status] ?? INVENTORY_STATUS.NORMAL!;
            return (
              <div key={inv.warehouseType} className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{WAREHOUSE_NAMES[inv.warehouseType] ?? inv.warehouseType}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${st.tone}`}>{st.label}</span>
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums">{inv.quantity}</div>
                <div className="text-xs text-muted-foreground">安全库存 {inv.safetyStock}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {canManage ? (
        <ProductForm
          mode="edit"
          productId={product.id}
          storeId={product.storeId}
          stores={[{ id: product.storeId, name: product.storeName, site: product.storeSite }]}
          initial={{
            title: product.title,
            category: product.category,
            brand: product.brand,
            costPrice: String(product.costPrice),
            salePrice: String(product.salePrice),
            weightGrams: String(product.weightGrams),
            lengthMm: product.lengthMm?.toString() ?? "",
            widthMm: product.widthMm?.toString() ?? "",
            heightMm: product.heightMm?.toString() ?? "",
            status: product.status,
            listing: product.listing,
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">编辑商品</CardTitle>
            <CardDescription>当前角色只读，编辑需要运营或管理员权限</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
