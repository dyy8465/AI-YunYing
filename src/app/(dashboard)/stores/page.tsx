import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStoresWithStats } from "@/services/store.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, ShoppingCart, Globe, Clock, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateStoreForm } from "@/components/features/stores/create-store-form";
import { StoreCardActions } from "@/components/features/stores/store-card-actions";

export const dynamic = "force-dynamic";

const SITE_STYLES: Record<string, string> = {
  US: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  EU: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  JP: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  CA: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const SITE_NAMES: Record<string, string> = { US: "美国站", EU: "欧洲站", JP: "日本站", CA: "加拿大站" };

function relativeTime(date: Date | null): string {
  if (!date) return "从未同步";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export default async function StoresPage() {
  const session = await auth();
  if (!session?.user.permissions.includes("stores:view")) redirect("/403");

  const stores = await getStoresWithStats();
  const canManage = session.user.permissions.includes("stores:manage");
  const connected = stores.filter((s) => s.apiStatus === "CONNECTED").length;
  const totalProducts = stores.reduce((sum, s) => sum + s.productCount, 0);
  const totalOrders = stores.reduce((sum, s) => sum + s.orderCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">店铺管理</h1>
        <p className="text-sm text-muted-foreground">多店铺绑定 · 站点切换 · 数据同步 · 健康监控</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "绑定店铺", value: String(stores.length), icon: Store, tone: "bg-primary/10 text-primary" },
          { label: "已连接", value: `${connected}/${stores.length}`, icon: Globe, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "在售商品", value: String(totalProducts), icon: Package, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          { label: "累计订单", value: totalOrders.toLocaleString(), icon: ShoppingCart, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
        ].map((k) => (
          <Card key={k.label} className="card-hover">
            <CardHeader className="pb-2">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", k.tone)}>
                <k.icon className="h-4.5 w-4.5" />
              </div>
              <CardDescription className="mt-2 text-xs">{k.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((store) => (
            <Card key={store.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold", SITE_STYLES[store.site])}>
                      {store.site}
                    </div>
                    <div>
                      <CardTitle className="text-base">{store.name}</CardTitle>
                      <CardDescription className="text-xs">{SITE_NAMES[store.site]} · {store.currency}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={store.apiStatus === "CONNECTED" ? "default" : "secondary"} className="gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", store.apiStatus === "CONNECTED" ? "bg-white" : "bg-muted-foreground")} />
                    {store.apiStatus === "CONNECTED" ? "已连接" : store.apiStatus === "ERROR" ? "异常" : "未连接"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center">
                  <div>
                    <div className="text-lg font-semibold tabular-nums">{store.productCount}</div>
                    <div className="text-[11px] text-muted-foreground">在售商品</div>
                  </div>
                  <div className="border-x">
                    <div className="text-lg font-semibold tabular-nums">{store.orderCount.toLocaleString()}</div>
                    <div className="text-[11px] text-muted-foreground">累计订单</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {relativeTime(store.lastSyncedAt)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">最近同步</div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Seller ID</span><span className="font-mono">{store.sellerId}</span></div>
                  <div className="flex justify-between"><span>Marketplace</span><span className="font-mono">{store.marketplaceId}</span></div>
                </div>
                {canManage && <StoreCardActions storeId={store.id} status={store.apiStatus} />}
              </CardContent>
            </Card>
          ))}
        </div>

        {canManage ? (
          <CreateStoreForm />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><PlusCircle className="h-4 w-4" />绑定新店铺</CardTitle>
              <CardDescription>当前角色为只读，绑定店铺需要管理员权限</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

