import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUsers } from "@/services/user.service";
import { CreateUserForm } from "@/components/features/users/create-user-form";
import { RoleSelect } from "@/components/features/users/role-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "超级管理员",
  OWNER: "企业老板",
  OPERATOR: "运营人员",
  WAREHOUSE: "仓库人员",
  FINANCE: "财务人员",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user.permissions.includes("users:manage")) redirect("/403");
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">用户与角色</h1>
        <p className="text-sm text-muted-foreground">管理团队成员及其角色（RBAC）</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
            <CardDescription>共 {users.length} 个账号</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>当前角色</TableHead>
                  <TableHead className="w-44">切换角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{ROLE_LABELS[u.roleCode]}</Badge></TableCell>
                    <TableCell><RoleSelect userId={u.id} current={u.roleCode} disabled={u.email === "admin@aso.dev"} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <CreateUserForm />
      </div>
    </div>
  );
}
