"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pause, Play, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CampaignActions({ campaignId, status, dailyBudget }: { campaignId: string; status: string; dailyBudget: number }) {
  const router = useRouter();
  const [budget, setBudget] = useState(String(dailyBudget));
  const [busy, setBusy] = useState<string | null>(null);
  const enabled = status === "ENABLED";

  async function patch(name: string, body: object) {
    setBusy(name);
    await fetch(`/api/advertising/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={enabled ? "secondary" : "default"} size="sm" className="gap-1.5"
        disabled={busy !== null}
        onClick={() => patch("toggle", { status: enabled ? "PAUSED" : "ENABLED" })}
      >
        {enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {busy === "toggle" ? "处理中..." : enabled ? "暂停投放" : "恢复投放"}
      </Button>
      <Input type="number" min="1" step="0.01" className="w-24" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="日预算" />
      <Button
        variant="outline" size="sm" className="gap-1.5"
        disabled={busy !== null}
        onClick={() => patch("budget", { dailyBudget: Number(budget) })}
      >
        <Wallet className="h-3.5 w-3.5" />
        {busy === "budget" ? "保存中..." : "保存预算"}
      </Button>
    </div>
  );
}
