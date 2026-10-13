import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AiChat } from "@/components/features/ai/ai-chat";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AiAssistantPage() {
  const session = await auth();
  if (!session?.user.permissions.includes("ai:view")) redirect("/403");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI 运营助手</h1>
          <p className="text-sm text-muted-foreground">利润归因 · Listing 优化 · 补货预测 · 经营问答</p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-normal text-muted-foreground">
          <Database className="h-3.5 w-3.5" />
          上下文：近 30 天利润 / 销量 / 库存 / 广告
        </Badge>
      </div>
      <AiChat />
    </div>
  );
}
