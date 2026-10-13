"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CampaignForm({ stores }: { stores: { id: string; name: string; site: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ storeId: stores[0]?.id ?? "", name: "", type: "SP", dailyBudget: "30" });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(false); setLoading(true);
    const res = await fetch("/api/advertising/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dailyBudget: Number(form.dailyBudget) }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "创建失败");
      return;
    }
    setOk(true);
    setForm({ ...form, name: "" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4 text-primary" />新建广告活动</CardTitle>
        <CardDescription>SP 商品推广 / SB 品牌推广 / SD 展示推广</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ad-store">店铺</Label>
            <Select id="ad-store" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}（{s.site}）</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad-name">活动名称</Label>
            <Input id="ad-name" value={form.name} required minLength={2} maxLength={100}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：SP-Earbuds-Exact" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ad-type">类型</Label>
              <Select id="ad-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="SP">SP 商品推广</option>
                <option value="SB">SB 品牌推广</option>
                <option value="SD">SD 展示推广</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-budget">日预算 ($)</Label>
              <Input id="ad-budget" type="number" min="1" step="0.01" value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })} required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {ok && <p className="text-sm text-primary">创建成功，指标将在同步后生成 ✅</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "创建中..." : "创建活动"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}


