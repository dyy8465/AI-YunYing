"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CreateUserForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [roleCode, setRoleCode] = useState("OPERATOR");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(false); setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, roleCode }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "创建失败");
      return;
    }
    setOk(true);
    setName(""); setEmail(""); setPassword("Password123!");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新增用户</CardTitle>
        <CardDescription>创建团队成员并分配角色</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-name">姓名</Label>
            <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email">邮箱</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">初始密码</Label>
            <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-role">角色</Label>
            <Select id="new-role" value={roleCode} onChange={(e) => setRoleCode(e.target.value)}>
              <option value="ADMIN">超级管理员</option>
              <option value="OWNER">企业老板</option>
              <option value="OPERATOR">运营人员</option>
              <option value="WAREHOUSE">仓库人员</option>
              <option value="FINANCE">财务人员</option>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {ok && <p className="text-sm text-primary">创建成功</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "创建中..." : "创建用户"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
