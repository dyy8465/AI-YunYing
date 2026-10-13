import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { StoreSwitcher } from "@/components/layout/store-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { listStores } from "@/services/store.service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    // middleware 已处理，这里做防御性兜底
    throw new Error("UNAUTHORIZED");
  }

  const [stores, cookieStore] = await Promise.all([listStores(), cookies()]);
  const currentStore = cookieStore.get("storeId")?.value ?? "all";

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={session.user.permissions} />
      <div className="flex flex-1 flex-col">
        <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b px-6">
          <StoreSwitcher stores={stores} current={currentStore} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu name={session.user.name ?? ""} roleName={session.user.roleName} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
      </div>
    </div>
  );
}

