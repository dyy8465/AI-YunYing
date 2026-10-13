"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const SITE_OPTIONS = [
  { value: "US", label: "美国站 (US)" },
  { value: "EU", label: "欧洲站 (EU)" },
  { value: "JP", label: "日本站 (JP)" },
  { value: "CA", label: "加拿大站 (CA)" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD $" },
  { value: "EUR", label: "EUR €" },
  { value: "JPY", label: "JPY ¥" },
  { value: "CAD", label: "CAD $" },
  { value: "GBP", label: "GBP £" },
];

export function CreateStoreForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", site: "US", marketplaceId: "ATVPDKIKX0DER", sellerId: "", currency: "USD" });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(false); setLoading(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "创建失败");
      return;
    }
    setOk(true);
    setForm({ name: "", site: "US", marketplaceId: "ATVPDKIKX0DER", sellerId: "", currency: "USD" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><PlusCircle className="h-4 w-4 text-primary" />绑定新店铺</CardTitle>
        <CardDescription>填写 Amazon 店铺信息完成绑定（MVP 为模拟绑定）</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="store-name">店铺名称</Label>
            <Input id="store-name" value={form.name} maxLength={60} required
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：America Star Store" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="store-site">站点</Label>
              <Select id="store-site" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })}>
                {SITE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store-currency">币种</Label>
              <Select id="store-currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-marketplace">Marketplace ID</Label>
            <Input id="store-marketplace" value={form.marketplaceId} required
              onChange={(e) => setForm({ ...form, marketplaceId: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-seller">Seller ID</Label>
            <Input id="store-seller" value={form.sellerId} required minLength={6}
              onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
              placeholder="如：A1USSELLER002" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {ok && <p className="text-sm text-primary">绑定成功 ✅</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "绑定中..." : "绑定店铺"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
