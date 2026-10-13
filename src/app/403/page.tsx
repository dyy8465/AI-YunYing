import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="items-center text-center">
          <ShieldAlert className="mb-2 h-10 w-10 text-destructive" />
          <CardTitle>403 无权访问</CardTitle>
          <CardDescription>当前角色没有访问该页面的权限，请联系管理员。</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
