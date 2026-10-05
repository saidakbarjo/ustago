"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHydrated } from "@/lib/store";
import { formatCompact } from "@/lib/i18n";

export const CHART = { brand: "#3a55ff", violet: "#8b5cf6", green: "#16a34a", amber: "#f59e0b", cyan: "#06b6d4", pink: "#ec4899", slate: "#94a3b8", grid: "#eef0f5", axis: "#94a3b8" };
export const SERIES = [CHART.brand, CHART.violet, CHART.cyan, CHART.green, CHART.amber, CHART.pink, CHART.slate];

function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string; fmt?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border bg-white px-3 py-2 text-xs shadow-lift">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => <p key={p.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} /><span className="text-muted-foreground">{p.name}</span><span className="font-semibold">{fmt ? fmt(p.value) : p.value}</span></p>)}
    </div>
  );
}

const Shell = ({ h, children }: { h: number; children: React.ReactElement }) => {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="skeleton w-full" style={{ height: h }} />;
  return <div style={{ height: h }} className="w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
};

export function AreaTrend({ data, keys, height = 260, fmt }: { data: Record<string, number | string>[]; keys: { key: string; name: string; color?: string }[]; height?: number; fmt?: (v: number) => string }) {
  return (
    <Shell h={height}>
      <AreaChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
        <defs>{keys.map((k, i) => (
          <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={k.color ?? SERIES[i]} stopOpacity={0.28} /><stop offset="100%" stopColor={k.color ?? SERIES[i]} stopOpacity={0} /></linearGradient>
        ))}</defs>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART.axis }} dy={6} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART.axis }} tickFormatter={(v) => formatCompact(Number(v))} width={56} />
        <Tooltip content={<Tip fmt={fmt} />} cursor={{ stroke: CHART.grid, strokeWidth: 2 }} />
        {keys.map((k, i) => <Area key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color ?? SERIES[i]} strokeWidth={2.5} fill={`url(#g-${k.key})`} animationDuration={1200} dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }} />)}
      </AreaChart>
    </Shell>
  );
}

export function Bars({ data, keys, height = 260, stacked, fmt, layout = "horizontal" }: { data: Record<string, number | string>[]; keys: { key: string; name: string; color?: string }[]; height?: number; stacked?: boolean; fmt?: (v: number) => string; layout?: "horizontal" | "vertical" }) {
  const vertical = layout === "vertical";
  return (
    <Shell h={height}>
      <BarChart data={data} layout={layout} margin={{ top: 10, right: 6, left: vertical ? 10 : -12, bottom: 0 }} barCategoryGap={vertical ? 8 : "28%"}>
        <CartesianGrid vertical={vertical} horizontal={!vertical} stroke={CHART.grid} />
        {vertical ? <><XAxis type="number" hide /><YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#475569" }} width={120} /></>
          : <><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART.axis }} dy={6} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART.axis }} tickFormatter={(v) => formatCompact(Number(v))} width={40} allowDecimals={false} /></>}
        <Tooltip content={<Tip fmt={fmt} />} cursor={{ fill: "rgba(58,85,255,.06)", radius: 8 }} />
        {keys.map((k, i) => <Bar key={k.key} dataKey={k.key} name={k.name} stackId={stacked ? "s" : undefined} fill={k.color ?? SERIES[i]} radius={stacked && i < keys.length - 1 ? 0 : vertical ? [0, 8, 8, 0] : [8, 8, 0, 0]} animationDuration={1000} maxBarSize={vertical ? 22 : 34} />)}
      </BarChart>
    </Shell>
  );
}

export function Lines({ data, keys, height = 260, fmt }: { data: Record<string, number | string>[]; keys: { key: string; name: string; color?: string }[]; height?: number; fmt?: (v: number) => string }) {
  return (
    <Shell h={height}>
      <LineChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART.axis }} dy={6} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: CHART.axis }} tickFormatter={(v) => formatCompact(Number(v))} width={40} />
        <Tooltip content={<Tip fmt={fmt} />} />
        {keys.map((k, i) => <Line key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color ?? SERIES[i]} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }} animationDuration={1200} />)}
      </LineChart>
    </Shell>
  );
}

export function Donut({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full max-w-[220px]">
        <Shell h={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={3} stroke="none" animationDuration={1000}>
              {data.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </Shell>
        <div className="pointer-events-none absolute inset-0 grid place-items-center"><p className="font-display text-2xl font-bold">{formatCompact(total)}</p></div>
      </div>
      <ul className="w-full flex-1 space-y-2.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[i % SERIES.length] }} /><span className="flex-1 text-muted-foreground">{d.name}</span><span className="font-semibold">{Math.round((d.value / total) * 100)}%</span></li>
        ))}
      </ul>
    </div>
  );
}
