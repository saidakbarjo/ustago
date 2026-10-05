"use client";
import Link from "next/link";
import { CalendarCheck, Inbox, CheckCircle2, Wallet, Star, UserPlus, Clock, MapPin, ArrowRight, Rocket, Eye, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useHydrated, useStore } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader, StatCard, StatusPill } from "@/components/layout/dashboard-shell";
import { Card, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/smart-image";
import { AreaTrend, Bars, Lines } from "@/components/charts";
import { OrderActions } from "@/components/dashboard/order-actions";
import { monthlySeries, pctDelta, weeklySeries } from "@/lib/analytics";
import { formatCompact, formatNumber } from "@/lib/i18n";
import { Counter } from "@/components/motion";
import { ymd } from "@/lib/utils";

export default function ProviderOverview() {
  const { t, tx, price, locale } = useI18n();
  const hydrated = useHydrated();
  const { provider: p, bookings } = useMyProvider();
  const users = useStore((s) => s.users);
  if (!p) return null;
  const today = ymd(new Date());
  const todays = bookings.filter((b) => b.date === today && b.status !== "cancelled").sort((a, b) => a.time.localeCompare(b.time));
  const pending = bookings.filter((b) => b.status === "pending");
  const monthly = monthlySeries(bookings, locale, { base: p.plan === "free" ? 2_400_000 : 6_800_000, growth: 0.07, seed: 2 });
  const weekly = weeklySeries(bookings, locale);
  const thisMonth = monthly[11], lastMonth = monthly[10];
  const completed = p.ordersCount + bookings.filter((b) => b.status === "completed").length;
  const svcName = (id: string) => tx(p.services.find((s) => s.id === id)?.name);

  return (
    <div>
      <PageHeader title={t("pdash.hello", { name: p.name.split(" ")[0] })} subtitle={t("pdash.helloSub", { n: todays.length, p: pending.length })}
        action={<div className="flex gap-2"><Button asChild variant="outline"><Link href={`/provider/${p.id}`}><Eye />{t("pdash.publicProfile")}</Link></Button><Button asChild><Link href="/provider-dashboard/orders">{t("pdash.orders")}<ArrowRight /></Link></Button></div>} />

      {p.verified && <div className="mb-6 flex items-center gap-3 rounded-[20px] border border-success/20 bg-success-soft/60 px-4 py-3 text-sm"><BadgeCheck className="h-5 w-5 text-success" /><span className="font-semibold text-success">{t("reg.approved")}</span><span className="hidden text-muted-foreground sm:inline">· {t("profile.verifiedText")}</span></div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={CalendarCheck} label={t("pdash.today")} value={<Counter to={todays.length} duration={0.8} />} tone="brand" />
        <StatCard icon={Inbox} label={t("pdash.pending")} value={<Counter to={pending.length} duration={0.8} />} tone="warning" />
        <StatCard icon={CheckCircle2} label={t("pdash.completed")} value={<Counter to={completed} />} tone="success" />
        <StatCard icon={Wallet} label={t("pdash.monthly")} value={hydrated ? formatCompact(thisMonth.earnings) : "—"} delta={pctDelta(thisMonth.earnings, lastMonth.earnings)} tone="dark" />
        <StatCard icon={Star} label={t("pdash.rating")} value={<Counter to={p.rating} decimals={2} />} tone="warning" />
        <StatCard icon={UserPlus} label={t("pdash.newCustomers")} value={<Counter to={thisMonth.customers} />} delta={pctDelta(thisMonth.customers, lastMonth.customers)} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div><p className="font-display text-lg font-semibold">{t("pdash.earningsChart")}</p><p className="font-display text-3xl font-bold">{price(thisMonth.earnings)}</p></div>
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">{pctDelta(thisMonth.earnings, lastMonth.earnings)} {t("pdash.vsLast")}</span>
          </div>
          <AreaTrend data={monthly} keys={[{ key: "earnings", name: t("pdash.earningsChart") }]} fmt={(v) => price(v)} height={280} />
        </Card>
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between"><p className="font-display text-lg font-semibold">{t("pdash.schedule")}</p><span className="text-sm text-muted-foreground">{t("common.today")}</span></div>
          {todays.length === 0 ? <EmptyState icon={<CalendarCheck />} title={t("pdash.noToday")} /> : (
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[27px] before:top-2 before:w-px before:bg-border">
              {todays.map((b) => (
                <li key={b.id} className="relative flex gap-3">
                  <span className="z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border bg-white font-display text-sm font-bold">{b.time}</span>
                  <div className="min-w-0 flex-1 rounded-2xl border bg-white p-3">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{b.customerName}</p><StatusPill status={b.status} /></div>
                    <p className="truncate text-xs text-muted-foreground">{svcName(b.serviceId)}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{b.address}</p>
                    <div className="mt-2"><OrderActions b={b} compact /></div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-1">
          <p className="mb-4 font-display text-lg font-semibold">{t("pdash.bookingsChart")}</p>
          <Bars data={weekly} keys={[{ key: "completed", name: t("dash.status.completed") }, { key: "new", name: t("pdash.requests"), color: "#c7d2fe" }]} stacked height={240} />
        </Card>
        <Card className="p-6 xl:col-span-1">
          <p className="mb-4 font-display text-lg font-semibold">{t("pdash.growthChart")}</p>
          <Lines data={monthly} keys={[{ key: "customers", name: t("pdash.newCustomers") }, { key: "repeat", name: t("pdash.repeat") }]} height={240} />
        </Card>
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between"><p className="font-display text-lg font-semibold">{t("pdash.requests")}</p><Link href="/provider-dashboard/orders" className="text-sm font-semibold text-primary">{t("common.viewAll")}</Link></div>
          {pending.length === 0 ? <EmptyState icon={<Inbox />} title={t("pdash.noRequests")} /> : (
            <ul className="space-y-3">
              {pending.slice(0, 3).map((b) => (
                <li key={b.id} className="rounded-2xl border p-3">
                  <div className="flex items-center gap-3"><Avatar src={users.find((u) => u.id === b.userId)?.avatar} name={b.customerName} className="h-10 w-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{b.customerName}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{b.date} · {b.time}</p></div><span className="text-sm font-bold">{formatNumber(b.price)}</span></div>
                  {b.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">“{b.description}”</p>}
                  <div className="mt-3"><OrderActions b={b} compact /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 flex flex-col items-start gap-4 overflow-hidden bg-gradient-to-r from-brand-600 to-violet-600 p-6 text-white sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Rocket className="h-6 w-6" /></span>
        <div className="flex-1"><p className="font-display text-lg font-semibold">{t("pdash.promote")}</p><p className="text-sm text-white/75">{t("pdash.promoteText")}</p></div>
        <Button asChild className="bg-white text-ink shadow-none hover:bg-white/90"><Link href="/pricing#promotion">{t("pdash.upgrade")}</Link></Button>
      </Card>
    </div>
  );
}
