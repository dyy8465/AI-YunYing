import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listStores } from "@/services/store.service";
import { ProductForm } from "@/components/features/products/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user.permissions.includes("products:manage")) redirect("/403");
  const stores = await listStores();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link href="/products"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新建商品</h1>
          <p className="text-sm text-muted-foreground">填写基础信息与 Listing（Listing 可稍后补充）</p>
        </div>
      </div>
      <ProductForm mode="create" stores={stores.map((s) => ({ id: s.id, name: s.name, site: s.site }))} />
    </div>
  );
}
