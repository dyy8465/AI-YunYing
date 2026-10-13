"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/config/constants";

export function ProductFilters({ stores }: { stores: { id: string; name: string; site: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function apply(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    params.delete("page"); // 筛选变化时回到第一页
    router.push(`/products?${params.toString()}`);
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => { e.preventDefault(); apply(); }}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="w-56 pl-9"
          placeholder="搜索标题 / SKU / ASIN"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Select
        aria-label="店铺筛选"
        className="w-44"
        value={searchParams.get("storeId") ?? ""}
        onChange={(e) => apply({ storeId: e.target.value || undefined })}
      >
        <option value="">全部店铺</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>{s.name}（{s.site}）</option>
        ))}
      </Select>
      <Select
        aria-label="类目筛选"
        className="w-36"
        value={searchParams.get("category") ?? ""}
        onChange={(e) => apply({ category: e.target.value || undefined })}
      >
        <option value="">全部类目</option>
        {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      <Select
        aria-label="状态筛选"
        className="w-32"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value || undefined })}
      >
        <option value="">全部状态</option>
        <option value="ACTIVE">在售</option>
        <option value="INACTIVE">停售</option>
      </Select>
      <Button type="submit" variant="secondary" size="sm">搜索</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/products")}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
