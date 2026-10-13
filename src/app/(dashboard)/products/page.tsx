import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProducts } from "@/services/product.service";
import { listStores } from "@/services/store.service";
import { productQuerySchema } from "@/lib/validations/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductFilters } from "@/components/features/products/product-filters";
import { Plus, ChevronLeft, ChevronRight, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user.permissions.includes("products:view")) redirect("/403");

  const raw = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const query = productQuerySchema.parse(raw);
  const [{ items, total, page, pageSize }, stores] = await Promise.all([getProducts(query), listStores()]);
  const canManage = session.user.permissions.includes("products:manage");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.storeId) params.set("storeId", query.storeId);
    if (query.category) params.set("category", query.category);
    if (query.status) params.set("status", query.status);
    params.set("page", String(p));
    return `/products?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">商品中心</h1>
          <p className="text-sm text-muted-foreground">SKU · ASIN · Listing 一站式管理</p>
        </div>
        {canManage && (
          <Button asChild className="gap-1.5">
            <Link href="/products/new"><Plus className="h-4 w-4" />新建商品</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <ProductFilters stores={stores.map((s) => ({ id: s.id, name: s.name, site: s.site }))} />
          <span className="text-sm text-muted-foreground">共 {total} 个商品</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品</TableHead>
                <TableHead>店铺</TableHead>
                <TableHead>类目 / 品牌</TableHead>
                <TableHead className="text-right">成本 / 售价</TableHead>
                <TableHead className="text-right">FBA 库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    没有匹配的商品，试试调整筛选条件
                  </TableCell>
                </TableRow>
              )}
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {p.title.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="max-w-[280px] truncate font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.sku} · {p.asin}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.storeName}</TableCell>
                  <TableCell className="text-sm">
                    <div>{p.category}</div>
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <div className="font-medium">${p.salePrice.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">成本 ${p.costPrice.toFixed(2)}</div>
                  </TableCell>
                  <TableCell className={`text-right text-sm tabular-nums font-medium ${p.fbaQty === 0 ? "text-destructive" : p.fbaQty < 50 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                    {p.fbaQty}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>
                      {p.status === "ACTIVE" ? "在售" : "停售"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/products/${p.id}`}>详情</Link>
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
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageUrl(page - 1)}><ChevronLeft className="h-4 w-4" />上一页</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageUrl(page + 1)}>下一页<ChevronRight className="h-4 w-4" /></Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

