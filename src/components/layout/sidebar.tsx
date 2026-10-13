"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { filterNavItems } from "@/config/menu";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const items = filterNavItems(permissions);

  const coreItems = items.filter((i) => !["/advertising", "/finance", "/ai-assistant", "/users"].includes(i.href));
  const advItems = items.filter((i) => ["/advertising", "/finance", "/ai-assistant"].includes(i.href));
  const adminItems = items.filter((i) => i.href === "/users");

  function renderGroup(label: string, group: typeof items) {
    if (group.length === 0) return null;
    return (
      <div>
        <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{label}</div>
        {group.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {active && <span aria-hidden className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <Icon className={cn("h-4 w-4 transition-transform", !active && "group-hover:scale-110")} />
              {item.label}
              {item.badge && (
                <Badge variant="outline" className="ml-auto text-[10px] font-normal text-muted-foreground">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">Amazon Seller OS</div>
          <div className="text-[10px] text-muted-foreground">智能运营管理平台</div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {renderGroup("核心运营", coreItems)}
        {renderGroup("增长分析", advItems)}
        {renderGroup("系统管理", adminItems)}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          v0.1 · Phase 1 已交付
        </div>
      </div>
    </aside>
  );
}
