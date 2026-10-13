"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["hsl(142 70% 45%)", "hsl(217 91% 60%)", "hsl(258 90% 66%)", "hsl(258 90% 66%)", "hsl(0 84% 60%)", "hsl(215 16% 55%)"];

export interface MonthlyProfitPointView {
  month: string;
  revenue: number;
  netProfit: number;
  margin: number;
}

export function MonthlyProfitChart({ data }: { data: MonthlyProfitPointView[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(2)} />
        <YAxis tick={{ fontSize: 11 }} width={64} />
        <Tooltip
          formatter={(value, name) => [
            `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            name as string,
          ]}
        />
        <Legend />
        <Bar dataKey="revenue" name="收入" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Line
          type="monotone"
          dataKey="netProfit"
          name="净利润"
          stroke="hsl(142 70% 45%)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function CostBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        暂无成本数据
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={4}>
          {filtered.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
