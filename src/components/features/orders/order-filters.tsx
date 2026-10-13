"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-state";

export function OrderFilters({ stores }: { stores: { id: string; name: string; site: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function buildParams(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    params.delete("page");
    return params;
  }

  function apply(overrides: Record<string, string | undefined> = {}) {
    router.push(`/orders?${buildParams(overrides).toString()}`);
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); apply(); }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="w-56 pl-9" placeholder="搜索订单号 / 买家" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Select aria-label="店铺筛选" className="w-44" value={searchParams.get("storeId") ?? ""}
        onChange={(e) => apply({ storeId: e.target.value || undefined })}>
        <option value="">全部店铺</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}（{s.site}）</option>)}
      </Select>
      <Select aria-label="状态筛选" className="w-32" value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value || undefined })}>
        <option value="">全部状态</option>
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
      </Select>
      <Select aria-label="渠道筛选" className="w-28" value={searchParams.get("channel") ?? ""}
        onChange={(e) => apply({ channel: e.target.value || undefined })}>
        <option value="">全部渠道</option>
        <option value="FBA">FBA</option>
        <option value="FBM">FBM</option>
      </Select>
      <Button type="submit" variant="secondary" size="sm">搜索</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/orders")}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <a href={`/api/orders/export?${buildParams().toString()}`}>
          <Download className="h-3.5 w-3.5" />导出 CSV
        </a>
      </Button>
    </form>
  );
}
