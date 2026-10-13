"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/config/constants";

export interface ProductFormInitial {
  title: string;
  category: string;
  brand: string;
  costPrice: string;
  salePrice: string;
  weightGrams: string;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  status: string;
  listing?: { title: string; bullets: string[]; description: string; searchTerms: string } | null;
}

interface Props {
  mode: "create" | "edit";
  stores: { id: string; name: string; site: string }[];
  productId?: string;
  storeId?: string;
  initial?: ProductFormInitial;
}

const EMPTY: ProductFormInitial = {
  title: "", category: PRODUCT_CATEGORIES[0], brand: "", costPrice: "", salePrice: "",
  weightGrams: "", lengthMm: "", widthMm: "", heightMm: "", status: "ACTIVE",
  listing: { title: "", bullets: [], description: "", searchTerms: "" },
};

export function ProductForm({ mode, stores, productId, storeId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormInitial>(initial ?? EMPTY);
  const [selectedStore, setSelectedStore] = useState(storeId ?? stores[0]?.id ?? "");
  const [sku, setSku] = useState("");
  const [asin, setAsin] = useState("");
  const [fnsku, setFnsku] = useState("");
  const [bulletsText, setBulletsText] = useState((initial?.listing?.bullets ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = mode === "edit";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(false); setLoading(true);

    const listing = form.listing?.title || bulletsText
      ? {
          title: form.listing?.title || form.title,
          bullets: bulletsText.split("\n").map((b) => b.trim()).filter(Boolean),
          description: form.listing?.description ?? "",
          searchTerms: form.listing?.searchTerms ?? "",
        }
      : undefined;

    const payload: Record<string, unknown> = {
      title: form.title, category: form.category, brand: form.brand,
      costPrice: Number(form.costPrice), salePrice: Number(form.salePrice),
      weightGrams: Number(form.weightGrams), status: form.status,
      ...(form.lengthMm && { lengthMm: Number(form.lengthMm) }),
      ...(form.widthMm && { widthMm: Number(form.widthMm) }),
      ...(form.heightMm && { heightMm: Number(form.heightMm) }),
      ...(listing ? { listing } : {}),
    };

    const res = await fetch(isEdit ? `/api/products/${productId}` : "/api/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? payload : { ...payload, storeId: selectedStore, sku, asin, fnsku }),
    });

    setLoading(false);
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.message ?? "提交失败");
      return;
    }
    if (isEdit) {
      setOk(true);
      router.refresh();
    } else {
      router.push(`/products/${body.id}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基础信息</CardTitle>
          <CardDescription>{isEdit ? "SKU / ASIN / FNSKU 创建后不可修改" : "商品标识与归属店铺"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label>所属店铺</Label>
                <Select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} required>
                  {stores.map((s) => <option key={s.id} value={s.id}>{s.name}（{s.site}）</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-sku">SKU</Label>
                  <Input id="pf-sku" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} placeholder="SKU-0031" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-asin">ASIN</Label>
                  <Input id="pf-asin" value={asin} onChange={(e) => setAsin(e.target.value.toUpperCase())} placeholder="B0XXXXXXX" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-fnsku">FNSKU</Label>
                  <Input id="pf-fnsku" value={fnsku} onChange={(e) => setFnsku(e.target.value.toUpperCase())} placeholder="X0XXXXXXX" required />
                </div>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pf-title">商品标题</Label>
            <Input id="pf-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-category">类目</Label>
              <Select id="pf-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-brand">品牌</Label>
              <Input id="pf-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-status">状态</Label>
              <Select id="pf-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">在售</option>
                <option value="INACTIVE">停售</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-cost">成本价 ($)</Label>
              <Input id="pf-cost" type="number" step="0.01" min="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-sale">销售价 ($)</Label>
              <Input id="pf-sale" type="number" step="0.01" min="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-weight">重量(g)</Label>
              <Input id="pf-weight" type="number" min="1" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-l">长(mm)</Label>
              <Input id="pf-l" type="number" min="1" value={form.lengthMm} onChange={(e) => setForm({ ...form, lengthMm: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-w">宽(mm)</Label>
              <Input id="pf-w" type="number" min="1" value={form.widthMm} onChange={(e) => setForm({ ...form, widthMm: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-h">高(mm)</Label>
              <Input id="pf-h" type="number" min="1" value={form.heightMm} onChange={(e) => setForm({ ...form, heightMm: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listing 信息</CardTitle>
          <CardDescription>标题、五点描述、Search Terms（AI 辅助生成将在 P2 提供）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pf-ltitle">Listing 标题</Label>
            <Input id="pf-ltitle" maxLength={300}
              value={form.listing?.title ?? ""}
              onChange={(e) => setForm({ ...form, listing: { ...(form.listing ?? { bullets: [], description: "", searchTerms: "" }), title: e.target.value } })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-bullets">五点描述（每行一条，3-5 条）</Label>
            <textarea
              id="pf-bullets"
              className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={bulletsText}
              onChange={(e) => setBulletsText(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-desc">产品描述</Label>
            <textarea
              id="pf-desc"
              className="min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.listing?.description ?? ""}
              onChange={(e) => setForm({ ...form, listing: { ...(form.listing ?? { title: "", bullets: [], searchTerms: "" }), description: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-sterms">Search Terms</Label>
            <Input id="pf-sterms" maxLength={500}
              value={form.listing?.searchTerms ?? ""}
              onChange={(e) => setForm({ ...form, listing: { ...(form.listing ?? { title: "", bullets: [], description: "" }), searchTerms: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={loading} className="gap-1.5">
          <PackagePlus className="h-4 w-4" />
          {loading ? "保存中..." : isEdit ? "保存修改" : "创建商品"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {ok && <p className="text-sm text-primary">保存成功 ✅</p>}
      </div>
    </form>
  );
}
