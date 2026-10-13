"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INVENTORY_STATUSES, WAREHOUSE_TYPES } from "@/lib/validations/inventory";

const WAREHOUSE_LABELS: Record<string, string> = { FBA: "FBA 仓", OVERSEAS: "海外仓", DOMESTIC: "国内仓" };
const STATUS_LABELS: Record<string, string> = {
  NORMAL: "正常", LOW_STOCK: "库存预警", OUT_OF_STOCK_RISK: "断货风险", SLOW_MOVING: "滞销",
};

export function InventoryFilters({ stores }: { stores: { id: string; name: string; site: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function apply(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    params.delete("page");
    router.push(`/inventory?${params.toString()}`);
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); apply(); }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="w-52 pl-9" placeholder="搜索商品 / SKU" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Select aria-label="店铺筛选" className="w-44" value={searchParams.get("storeId") ?? ""}
        onChange={(e) => apply({ storeId: e.target.value || undefined })}>
        <option value="">全部店铺</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}（{s.site}）</option>)}
      </Select>
      <Select aria-label="仓库筛选" className="w-32" value={searchParams.get("warehouse") ?? ""}
        onChange={(e) => apply({ warehouse: e.target.value || undefined })}>
        <option value="">全部仓库</option>
        {WAREHOUSE_TYPES.map((w) => <option key={w} value={w}>{WAREHOUSE_LABELS[w]}</option>)}
      </Select>
      <Select aria-label="状态筛选" className="w-32" value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value || undefined })}>
        <option value="">全部状态</option>
        {INVENTORY_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </Select>
      <Button type="submit" variant="secondary" size="sm">搜索</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/inventory")}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
