"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["hsl(142 70% 45%)", "hsl(217 91% 60%)", "hsl(258 90% 66%)", "hsl(0 84% 60%)"];

export function SalesTrendChart({ data }: { data: { date: string; sales: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 70% 45%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(142 70% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} width={56} />
        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "销售额"]} />
        <Area type="monotone" dataKey="sales" stroke="hsl(142 70% 45%)" fill="url(#salesFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: { data: { name: string; quantity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
        <Tooltip />
        <Bar dataKey="quantity" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} name="销量" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SiteDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={4}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProfitTrendChart({ data }: { data: { date: string; netProfit: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(258 90% 66%)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="hsl(258 90% 66%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} width={56} />
        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "净利润"]} />
        <Area type="monotone" dataKey="netProfit" stroke="hsl(258 90% 66%)" fill="url(#profitFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
