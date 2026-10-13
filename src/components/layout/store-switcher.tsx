"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Select } from "@/components/ui/select";

export interface StoreOption {
  id: string;
  name: string;
  site: string;
}

export function StoreSwitcher({ stores, current }: { stores: StoreOption[]; current: string }) {
  const router = useRouter();

  function onChange(value: string) {
    document.cookie = `storeId=${value}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        aria-label="切换店铺"
        className="w-44"
        value={current}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">全部店铺</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}（{s.site}）
          </option>
        ))}
      </Select>
    </div>
  );
}
