"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreCardActions({ storeId, status }: { storeId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"sync" | "toggle" | null>(null);
  const connected = status === "CONNECTED";

  async function call(path: string, method: string, body?: object, kind: "sync" | "toggle" = "sync") {
    setBusy(kind);
    await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline" size="sm" className="flex-1 gap-1.5"
        disabled={busy !== null}
        onClick={() => call(`/api/stores/${storeId}/sync`, "POST", undefined, "sync")}
      >
        <RefreshCw className={busy === "sync" ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {busy === "sync" ? "同步中" : "同步数据"}
      </Button>
      <Button
        variant={connected ? "secondary" : "default"} size="sm" className="flex-1 gap-1.5"
        disabled={busy !== null}
        onClick={() => call(`/api/stores/${storeId}`, "PATCH", { apiStatus: connected ? "DISCONNECTED" : "CONNECTED" }, "toggle")}
      >
        {connected ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {connected ? "断开" : "连接"}
      </Button>
    </div>
  );
}
