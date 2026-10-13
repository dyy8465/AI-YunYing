"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinanceExportButton({ period, storeId }: { period: string; storeId: string }) {
  const [loading, setLoading] = useState(false);

  function onExport() {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (storeId && storeId !== "all") params.set("storeId", storeId);
    window.location.href = `/api/finance/export?${params.toString()}`;
    // 下载由浏览器处理，稍后恢复按钮状态
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <Button variant="outline" size="sm" onClick={onExport} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      导出报表
    </Button>
  );
}
