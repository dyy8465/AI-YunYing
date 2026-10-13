"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShoppingBag, Mail, Lock, ArrowRight, Check, TrendingUp, Boxes, Wallet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { role: "超级管理员", email: "admin@aso.dev", tone: "bg-primary/10 text-primary" },
  { role: "企业老板", email: "owner@aso.dev", tone: "bg-blue-500/10 text-blue-500" },
  { role: "运营人员", email: "operator@aso.dev", tone: "bg-violet-500/10 text-violet-500" },
  { role: "仓库人员", email: "warehouse@aso.dev", tone: "bg-amber-500/10 text-amber-500" },
  { role: "财务人员", email: "finance@aso.dev", tone: "bg-rose-500/10 text-rose-500" },
];

const FEATURES = [
  { icon: TrendingUp, title: "数据驾驶舱", desc: "销售 / 利润 / 站点分布一屏总览" },
  { icon: Boxes, title: "库存智能化", desc: "三仓联动 · 断货预警 · 补货建议" },
  { icon: Wallet, title: "利润精细化", desc: "SKU 级成本拆解与趋势分析" },
  { icon: Sparkles, title: "AI 运营助手", desc: "经营异动归因，优化建议直达" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("admin@aso.dev");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("邮箱或密码不正确");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40 p-4">
      {/* 背景装饰 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_400px]">
        {/* 品牌区 */}
        <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden className="bg-grid absolute inset-0" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Amazon Seller OS</h1>
                <p className="text-sm text-white/70">亚马逊跨境电商智能运营管理平台</p>
              </div>
            </div>

            <p className="mt-10 max-w-md text-3xl font-bold leading-snug">
              一个平台，管好
              <span className="text-emerald-300">商品 · 订单 · 库存 · 广告 · 利润</span>
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-2 gap-4">
            {FEATURES.map((item) => (
              <div key={item.title} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <item.icon className="mb-2 h-5 w-5 text-emerald-300" />
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-white/70">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-8 flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" />RBAC 多角色权限</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" />90 天模拟数据</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-300" />深色模式</span>
          </div>
        </div>

        {/* 登录卡片 */}
        <Card className="border-border/60 shadow-xl backdrop-blur">
          <CardHeader className="pb-2">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 lg:hidden">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">欢迎回来 👋</CardTitle>
            <CardDescription>选择演示账号或直接登录体验</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "登录中..." : "登录控制台"}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>

            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">演示账号 · 点击填入（密码 Password123!）</p>
              <div className="grid grid-cols-1 gap-1">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-accent"
                    onClick={() => { setEmail(a.email); setPassword("Password123!"); }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${a.tone}`}>{a.role}</span>
                    </span>
                    <span className="text-muted-foreground group-hover:text-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
