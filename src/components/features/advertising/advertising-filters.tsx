"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CAMPAIGN_TYPES } from "@/lib/validations/advertising";

export function AdvertisingFilters({ stores }: { stores: { id: string; name: string; site: string }[] }) {
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
    router.push(`/advertising?${params.toString()}`);
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); apply(); }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="w-48 pl-9" placeholder="搜索活动名称" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Select aria-label="店铺筛选" className="w-44" value={searchParams.get("storeId") ?? ""}
        onChange={(e) => apply({ storeId: e.target.value || undefined })}>
        <option value="">全部店铺</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}（{s.site}）</option>)}
      </Select>
      <Select aria-label="类型筛选" className="w-28" value={searchParams.get("type") ?? ""}
        onChange={(e) => apply({ type: e.target.value || undefined })}>
        <option value="">全部类型</option>
        {CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </Select>
      <Select aria-label="状态筛选" className="w-28" value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value || undefined })}>
        <option value="">全部状态</option>
        <option value="ENABLED">投放中</option>
        <option value="PAUSED">已暂停</option>
      </Select>
      <Button type="submit" variant="secondary" size="sm">搜索</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/advertising")}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

