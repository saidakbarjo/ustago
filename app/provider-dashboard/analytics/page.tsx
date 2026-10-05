"use client";
import { Eye, MousePointerClick, Repeat, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCompact } from "@/lib/i18n";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader, StatCard } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/misc";
import { AreaTrend, Bars, Donut } from "@/components/charts";
import { monthlySeries } from "@/lib/analytics";

export default function AnalyticsPage() {
  const { t, tx, price, locale } = useI18n();
  const { provider: p, bookings } = useMyProvider();
  if (!p) return null;
  const monthly = monthlySeries(bookings, locale, { base: 6_800_000, growth: 0.07, seed: 2 }).map((m, i) => ({ ...m, views: Math.round(m.bookings * 14 + 120 + i * 30) }));
  const cur = monthly[11];
  const top = p.services.map((s, i) => ({ label: tx(s.name), value: bookings.filter((b) => b.serviceId === s.id).length * 3 + (p.services.length - i) * 6 }));
  return (
    <div>
      <PageHeader title={t("pdash.analytics")} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Eye} label={t("pdash.views")} value={formatCompact(cur.views)} delta="+18%" tone="brand" />
        <StatCard icon={MousePointerClick} label={t("pdash.conversion")} value={`${((cur.bookings / cur.views) * 100).toFixed(1)}%`} delta="+2.1%" tone="success" />
        <StatCard icon={Repeat} label={t("pdash.repeat")} value={`${Math.round((cur.repeat / Math.max(1, cur.bookings)) * 100)}%`} delta="+4%" tone="violet" />
        <StatCard icon={Receipt} label={t("pdash.avgCheck")} value={formatCompact(Math.round(cur.earnings / Math.max(1, cur.bookings)))} tone="warning" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-6"><p className="mb-4 font-display text-lg font-semibold">{t("pdash.views")} & {t("pdash.bookingsChart")}</p><AreaTrend data={monthly} keys={[{ key: "views", name: t("pdash.views") }, { key: "bookings", name: t("pdash.bookingsChart") }]} height={300} /></Card>
        <Card className="p-6"><p className="mb-4 font-display text-lg font-semibold">{t("pdash.sources")}</p><Donut data={[{ name: t("nav.search"), value: 46 }, { name: t("nav.categories"), value: 22 }, { name: "Google", value: 18 }, { name: "Telegram", value: 9 }, { name: "Direct", value: 5 }]} /></Card>
      </div>
      <Card className="mt-6 p-6"><p className="mb-4 font-display text-lg font-semibold">{t("pdash.topServices")}</p><Bars layout="vertical" data={top} keys={[{ key: "value", name: t("pdash.bookingsChart") }]} height={Math.max(180, top.length * 52)} /></Card>
      <p className="mt-4 text-xs text-muted-foreground">{price(cur.earnings)} · {cur.label}</p>
    </div>
  );
}
