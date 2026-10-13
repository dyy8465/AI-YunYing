"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ productId, title }: { productId: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm(`确定删除商品「${title}」吗？删除后可在数据库层面恢复（软删除）。`)) return;
    setLoading(true);
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/products");
      router.refresh();
    }
  }

  return (
    <Button variant="destructive" size="sm" className="gap-1.5" disabled={loading} onClick={onDelete}>
      <Trash2 className="h-3.5 w-3.5" />
      {loading ? "删除中..." : "删除商品"}
    </Button>
  );
}
