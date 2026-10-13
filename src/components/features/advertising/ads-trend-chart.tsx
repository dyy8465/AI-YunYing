"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdsTrendChart({ data }: { data: { date: string; spend: number; sales: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} width={52} />
        <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === "spend" ? "广告花费" : "广告销售"]} />
        <Legend formatter={(v) => (v === "spend" ? "广告花费" : "广告销售")} />
        <Line type="monotone" dataKey="spend" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="sales" stroke="hsl(142 70% 45%)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
