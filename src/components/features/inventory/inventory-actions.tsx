"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { WAREHOUSE_TYPES } from "@/lib/validations/inventory";

const WAREHOUSE_LABELS: Record<string, string> = { FBA: "FBA 仓", OVERSEAS: "海外仓", DOMESTIC: "国内仓" };

export function InventoryActions({
  inventoryId,
  currentWarehouse,
  currentSafetyStock,
}: {
  inventoryId: string;
  currentWarehouse: string;
  currentSafetyStock: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adjType, setAdjType] = useState<"IN" | "OUT">("IN");
  const [adjQty, setAdjQty] = useState("10");
  const [adjRef, setAdjRef] = useState("");

  const [toWarehouse, setToWarehouse] = useState(
    WAREHOUSE_TYPES.find((w) => w !== currentWarehouse) ?? "OVERSEAS",
  );
  const [trQty, setTrQty] = useState("10");

  const [safety, setSafety] = useState(String(currentSafetyStock));

  async function call(name: string, path: string, method: string, body: object) {
    setBusy(name); setError(null);
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "操作失败");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">库存操作</CardTitle>
        <CardDescription>所有操作均写入库存流水，余额不足会被拒绝</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 出入库 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">入库 / 出库</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Select className="w-24" value={adjType} onChange={(e) => setAdjType(e.target.value as "IN" | "OUT")}>
              <option value="IN">入库</option>
              <option value="OUT">出库</option>
            </Select>
            <Input type="number" min="1" className="w-24" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} />
            <Input className="w-36" placeholder="单号（可选）" value={adjRef} onChange={(e) => setAdjRef(e.target.value)} maxLength={60} />
            <Button
              size="sm" variant={adjType === "IN" ? "default" : "destructive"} className="gap-1.5"
              disabled={busy !== null}
              onClick={() => call("adjust", `/api/inventory/${inventoryId}/adjust`, "POST", {
                type: adjType, quantity: Number(adjQty), ...(adjRef ? { reference: adjRef } : {}),
              })}
            >
              {adjType === "IN" ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
              {busy === "adjust" ? "执行中..." : "确认执行"}
            </Button>
          </div>
        </div>

        {/* 调拨 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">仓间调拨（{WAREHOUSE_LABELS[currentWarehouse]} → 目标仓）</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Select className="w-32" value={toWarehouse} onChange={(e) => setToWarehouse(e.target.value as (typeof WAREHOUSE_TYPES)[number])}>
              {WAREHOUSE_TYPES.filter((w) => w !== currentWarehouse).map((w) => (
                <option key={w} value={w}>{WAREHOUSE_LABELS[w]}</option>
              ))}
            </Select>
            <Input type="number" min="1" className="w-24" value={trQty} onChange={(e) => setTrQty(e.target.value)} />
            <Button
              size="sm" variant="outline" className="gap-1.5"
              disabled={busy !== null}
              onClick={() => call("transfer", `/api/inventory/${inventoryId}/transfer`, "POST", {
                toWarehouse, quantity: Number(trQty),
              })}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {busy === "transfer" ? "调拨中..." : "确认调拨"}
            </Button>
          </div>
        </div>

        {/* 安全库存 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">安全库存（预警阈值）</Label>
          <div className="flex items-center gap-2">
            <Input type="number" min="1" className="w-24" value={safety} onChange={(e) => setSafety(e.target.value)} />
            <Button
              size="sm" variant="secondary" className="gap-1.5"
              disabled={busy !== null}
              onClick={() => call("safety", `/api/inventory/${inventoryId}/safety-stock`, "PATCH", { safetyStock: Number(safety) })}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {busy === "safety" ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

