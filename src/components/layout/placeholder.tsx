import { Construction } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Placeholder({ title, phase, description }: { title: string; phase: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Construction className="h-5 w-5 text-muted-foreground" />
            <CardTitle>模块开发中</CardTitle>
            <Badge variant="outline">{phase}</Badge>
          </div>
          <CardDescription>
            当前为 Phase 1（基础框架），该模块将在对应阶段按路线图实现。
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

