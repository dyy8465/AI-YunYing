"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/select";

const ROLES = [
  { value: "ADMIN", label: "超级管理员" },
  { value: "OWNER", label: "企业老板" },
  { value: "OPERATOR", label: "运营人员" },
  { value: "WAREHOUSE", label: "仓库人员" },
  { value: "FINANCE", label: "财务人员" },
];

export function RoleSelect({ userId, current, disabled }: { userId: string; current: string; disabled?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onChange(roleCode: string) {
    setSaving(true);
    await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleCode }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Select value={current} disabled={disabled || saving} onChange={(e) => onChange(e.target.value)} aria-label="切换角色">
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </Select>
  );
}
