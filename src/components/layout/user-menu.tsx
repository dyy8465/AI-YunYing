"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function UserMenu({ name, roleName }: { name: string; roleName: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{roleName}</div>
      </div>
      <Button variant="ghost" size="icon" aria-label="退出登录" onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
