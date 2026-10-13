"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/order-state";

export function OrderTransition({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<OrderStatus | null>(null);
  const targets = ORDER_TRANSITIONS[current];
  const isRefund = (s: OrderStatus) => s === "REFUNDED";

  async function transition(target: OrderStatus) {
    if (isRefund(target) && !window.confirm("确认将此订单标记为已退款吗？此操作用于售后处理。")) return;
    setLoading(target);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.message ?? "操作失败");
      return;
    }
    router.refresh();
  }

  if (targets.length === 0) {
    return <span className="text-sm text-muted-foreground">终态订单，不可流转</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <Button
          key={target}
          size="sm"
          variant={isRefund(target) ? "destructive" : "default"}
          className="gap-1.5"
          disabled={loading !== null}
          onClick={() => transition(target)}
        >
          {isRefund(target) ? <Undo2 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
          {loading === target ? "处理中..." : `标记为${ORDER_STATUS_LABELS[target]}`}
        </Button>
      ))}
    </div>
  );
}
