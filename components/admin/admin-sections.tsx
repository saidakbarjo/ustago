"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Users, Briefcase, CalendarCheck, Wallet, Activity, CheckCircle2, Search, ShieldCheck, Ban, Rocket, Eye, EyeOff, Flag, Plus, FileText,
  Check, X, AlertTriangle, Download, Percent, DollarSign, Tag, BadgeCheck, ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCompact, formatDate, formatNumber } from "@/lib/i18n";
import { getProviderById, useProviders, useReviews, useStore } from "@/lib/store";
import { CATEGORIES, CITIES, DEFAULT_PLANS, SERVICE_TYPES, getCategory, getCity } from "@/lib/data/catalog";
import { CITY_COUNTS, countByCategory } from "@/lib/search";
import { monthlySeries, monthLabel } from "@/lib/analytics";
import { PageHeader, StatCard, StatusPill } from "@/components/layout/dashboard-shell";
import { Card, EmptyState, Stars, Switch, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/smart-image";
import { AreaTrend, Bars, Lines } from "@/components/charts";
import { CategoryIcon } from "@/components/icons";
import { toast } from "@/components/ui/toast";
import type { BookingStatus, PlanId } from "@/lib/types";
import { cn } from "@/lib/utils";

function Table({ head, children, min = 760 }: { head: React.ReactNode[]; children: React.ReactNode; min?: number }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm" style={{ minWidth: min }}>
        <thead><tr className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">{head.map((h, i) => <th key={i} className="whitespace-nowrap px-5 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="[&>tr]:border-b [&>tr:last-child]:border-0 [&>tr:hover]:bg-secondary/30 [&_td]:px-5 [&_td]:py-3.5">{children}</tbody>
      </table>
    </Card>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return <div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t("admin.searchPlaceholder")} className="h-10 rounded-full pl-10" /></div>;
}

function usePlatformRevenue() {
  const payments = useStore((s) => s.payments);
  const bookings = useStore((s) => s.bookings);
  const commission = useStore((s) => s.commission);
  const fee = useStore((s) => s.serviceFeePercent);
  return useMemo(() => {
    const gmv = payments.filter((p) => p.kind === "booking" && p.status === "succeeded").reduce((s, p) => s + p.amount, 0);
    const take = bookings.filter((b) => b.status === "completed").reduce((s, b) => s + b.fee + b.price * (commission[getProviderById(b.providerId)?.plan ?? "free"] / 100), 0);
    const mrrUsd = payments.filter((p) => p.kind === "subscription").reduce((s, p) => s + p.amount, 0);
    return { gmv, take, mrrUsd, fee };
  }, [payments, bookings, commission, fee]);
}

/* ---------------- Overview ---------------- */
export function AdminOverview() {
  const { t, tx, price, locale } = useI18n();
  const users = useStore((s) => s.users);
  const bookings = useStore((s) => s.bookings);
  const allApps = useStore((s) => s.applications);
  const apps = allApps.filter((a) => a.status === "under_review");
  const providers = useProviders({ includeInactive: true });
  const rev = usePlatformRevenue();
  const series = monthlySeries(bookings, locale, { base: 182_000_000, growth: 0.11, seed: 1 }).map((m, i) => ({ ...m, revenue: Math.round(m.earnings * 0.14), signups: 900 + i * 140 + (i % 3) * 60, providers: 300 + i * 52 }));
  const cats = countByCategory(providers);
  const byCat = CATEGORIES.map((c) => ({ label: tx(c.name), value: Math.round(cats[c.id] * 1.8) + bookings.filter((b) => getProviderById(b.providerId)?.categoryId === c.id).length })).sort((a, b) => b.value - a.value);
  const totalUsers = 48_210 + users.length, totalProviders = 12_400 + providers.length;
  return (
    <div>
      <PageHeader title={t("admin.overview")} action={<Button variant="outline" onClick={() => toast.success("CSV")}><Download />{t("admin.exportCsv")}</Button>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={Users} label={t("admin.totalUsers")} value={formatNumber(totalUsers)} delta="+12%" tone="brand" />
        <StatCard icon={Briefcase} label={t("admin.totalProviders")} value={formatNumber(totalProviders)} delta="+8%" tone="violet" />
        <StatCard icon={CalendarCheck} label={t("admin.totalBookings")} value={formatNumber(241_380 + bookings.length)} delta="+19%" tone="success" />
        <StatCard icon={Wallet} label={t("admin.revenue")} value={formatCompact(series[11].revenue + rev.take)} delta="+23%" tone="dark" />
        <StatCard icon={Activity} label={t("admin.activeBookings")} value={formatNumber(1_284 + bookings.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).length)} tone="warning" />
        <StatCard icon={CheckCircle2} label={t("admin.completedBookings")} value={formatNumber(236_910 + bookings.filter((b) => b.status === "completed").length)} tone="success" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-6"><p className="font-display text-lg font-semibold">{t("admin.revenueChart")}</p><p className="mb-4 font-display text-3xl font-bold">{price(series[11].revenue)}</p><AreaTrend data={series} keys={[{ key: "revenue", name: t("admin.revenue") }]} fmt={(v) => price(v)} height={280} /></Card>
        <Card className="p-6"><p className="mb-4 font-display text-lg font-semibold">{t("admin.bookingsByCategory")}</p><Bars layout="vertical" data={byCat.slice(0, 8)} keys={[{ key: "value", name: t("admin.bookings") }]} height={320} /></Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card className="p-6"><p className="mb-4 font-display text-lg font-semibold">{t("admin.signups")}</p><Lines data={series} keys={[{ key: "signups", name: t("admin.users") }, { key: "providers", name: t("admin.providers") }]} height={260} /></Card>
        <Card className="p-0">
          <div className="flex items-center justify-between border-b px-6 py-4"><p className="font-display text-lg font-semibold">{t("admin.latestBookings")}</p><Link href="/admin/bookings" className="text-sm font-semibold text-primary">{t("common.viewAll")}</Link></div>
          <ul className="divide-y">
            {[...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                <Avatar src={getProviderById(b.providerId)?.avatar} name={getProviderById(b.providerId)?.name ?? ""} className="h-9 w-9" />
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{b.customerName} → {getProviderById(b.providerId)?.name}</p><p className="font-mono text-xs text-muted-foreground">{b.id} · {b.date}</p></div>
                <StatusPill status={b.status} /><span className="hidden w-28 text-right font-semibold sm:block">{price(b.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {apps.length > 0 && (
        <Card className="mt-6 flex flex-col gap-4 border-primary/20 bg-accent/50 p-5 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white"><ShieldCheck className="h-6 w-6" /></span>
          <div className="flex-1"><p className="font-semibold">{t("admin.pendingVerification")}: {apps.length}</p><p className="text-sm text-muted-foreground">{apps.map((a) => a.name).join(", ")}</p></div>
          <Button asChild><Link href="/admin/verification">{t("common.open")}</Link></Button>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Users ---------------- */
export function AdminUsers() {
  const { t, tx, locale } = useI18n();
  const users = useStore((s) => s.users);
  const setStatus = useStore((s) => s.setUserStatus);
  const bookings = useStore((s) => s.bookings);
  const [q, setQ] = useState("");
  const list = users.filter((u) => !q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title={t("admin.users")} subtitle={`${list.length}`} action={<SearchInput value={q} onChange={setQ} />} />
      <Table head={[t("common.name"), t("auth.email"), t("auth.phone"), t("admin.city"), t("admin.bookings"), t("admin.joined"), t("common.status"), ""]}>
        {list.map((u) => (
          <tr key={u.id}>
            <td><div className="flex items-center gap-3"><Avatar src={u.avatar} name={u.name} className="h-9 w-9" /><span className="font-medium">{u.name}</span></div></td>
            <td className="text-muted-foreground">{u.email}</td><td className="whitespace-nowrap text-muted-foreground">{u.phone}</td><td>{tx(getCity(u.citySlug)?.name)}</td>
            <td>{bookings.filter((b) => b.userId === u.id).length}</td><td className="whitespace-nowrap text-muted-foreground">{formatDate(u.createdAt, locale)}</td>
            <td>{u.status === "active" ? <Badge tone="success">{t("admin.active")}</Badge> : <Badge tone="danger">{t("admin.blocked")}</Badge>}</td>
            <td className="text-right">{u.status === "active" ? <Button size="sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setStatus(u.id, "blocked")}><Ban />{t("common.block")}</Button> : <Button size="sm" variant="ghost" onClick={() => setStatus(u.id, "active")}><Check />{t("common.unblock")}</Button>}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Providers ---------------- */
export function AdminProviders() {
  const { t, tx } = useI18n();
  const providers = useProviders({ includeInactive: true });
  const promoted = useStore((s) => s.promotedIds);
  const togglePromoted = useStore((s) => s.togglePromoted);
  const setStatus = useStore((s) => s.setProviderStatus);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const list = providers.filter((p) => (!q || `${p.name} ${tx(p.profession)}`.toLowerCase().includes(q.toLowerCase())) && (!cat || p.categoryId === cat)).slice(0, 80);
  return (
    <div>
      <PageHeader title={t("admin.providers")} subtitle={`${providers.length}`} action={<div className="flex flex-col gap-2 sm:flex-row"><Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-10 rounded-full"><option value="">{t("common.all")}</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tx(c.name)}</option>)}</Select><SearchInput value={q} onChange={setQ} /></div>} />
      <Table head={[t("common.name"), t("search.category"), t("admin.city"), t("admin.rating"), t("admin.plan"), t("common.status"), t("admin.promote"), ""]} min={900}>
        {list.map((p) => (
          <tr key={p.id}>
            <td><Link href={`/provider/${p.id}`} className="flex items-center gap-3"><Avatar src={p.avatar} name={p.name} className="h-9 w-9" /><span><span className="flex items-center gap-1 font-medium">{p.name}{p.verified && <BadgeCheck className="h-4 w-4 fill-success text-white" />}</span><span className="text-xs text-muted-foreground">{tx(p.profession)}</span></span></Link></td>
            <td>{tx(getCategory(p.categoryId)?.name)}</td><td>{tx(getCity(p.citySlug)?.name)}</td>
            <td className="whitespace-nowrap">★ {p.rating} <span className="text-muted-foreground">({p.reviewsCount})</span></td>
            <td><Badge tone={p.plan === "free" ? "neutral" : p.plan === "premium" ? "dark" : "brand"} className="uppercase">{p.plan}</Badge></td>
            <td>{p.status === "blocked" ? <Badge tone="danger">{t("admin.blocked")}</Badge> : <Badge tone="success">{t("admin.active")}</Badge>}</td>
            <td><Switch checked={promoted.includes(p.id)} onCheckedChange={() => { togglePromoted(p.id); toast.success(t("admin.promoted")); }} /></td>
            <td className="text-right">{p.status === "blocked" ? <Button size="sm" variant="ghost" onClick={() => setStatus(p.id, "active")}><Check />{t("common.unblock")}</Button> : <Button size="sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setStatus(p.id, "blocked")}><Ban />{t("common.block")}</Button>}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Categories / Services / Cities ---------------- */
export function AdminCategories() {
  const { t, tx } = useI18n();
  const inactive = useStore((s) => s.inactiveCategories);
  const toggle = useStore((s) => s.toggleCategory);
  const counts = countByCategory(useProviders());
  return (
    <div>
      <PageHeader title={t("admin.categories")} action={<Button onClick={() => toast.info(t("admin.addCategory"))}><Plus />{t("admin.addCategory")}</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Card key={c.id} className={cn("flex items-center gap-4 p-5", inactive.includes(c.id) && "opacity-60")}>
            <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white", c.tone)}><CategoryIcon icon={c.icon} className="h-5 w-5" /></span>
            <div className="flex-1"><p className="font-semibold">{tx(c.name)}</p><p className="text-xs text-muted-foreground">/{c.slug} · {formatNumber(counts[c.id])} · {SERVICE_TYPES.filter((s) => s.categoryId === c.id).length} {t("admin.services").toLowerCase()}</p></div>
            <Switch checked={!inactive.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
export function AdminServices() {
  const { t, tx, price } = useI18n();
  return (
    <div>
      <PageHeader title={t("admin.services")} subtitle={`${SERVICE_TYPES.length}`} />
      <Table head={[t("admin.services"), t("search.category"), "URL", t("admin.fromPrice"), ""]}>
        {SERVICE_TYPES.map((s) => (
          <tr key={s.slug}><td className="font-medium">{tx(s.name)}</td><td>{tx(getCategory(s.categoryId)?.name)}</td><td className="font-mono text-xs text-muted-foreground">/services/{s.slug}</td><td>{price(s.fromPrice)}</td><td className="text-right"><Button asChild size="sm" variant="ghost"><Link href={`/services/${s.slug}`}><ExternalLink />{t("common.open")}</Link></Button></td></tr>
        ))}
      </Table>
    </div>
  );
}
export function AdminCities() {
  const { t, tx } = useI18n();
  const inactive = useStore((s) => s.inactiveCities);
  const toggle = useStore((s) => s.toggleCity);
  return (
    <div>
      <PageHeader title={t("admin.cities")} action={<Button onClick={() => toast.info(t("admin.addCity"))}><Plus />{t("admin.addCity")}</Button>} />
      <Table head={[t("admin.city"), t("admin.city"), t("admin.providers"), "URL", t("common.status")]}>
        {CITIES.map((c) => (
          <tr key={c.slug}><td className="font-medium">{tx(c.name)}</td><td className="text-muted-foreground">{tx(c.region)}</td><td>{formatNumber(CITY_COUNTS[c.slug])}</td><td className="font-mono text-xs text-muted-foreground">/city/{c.slug}</td><td><Switch checked={!inactive.includes(c.slug)} onCheckedChange={() => toggle(c.slug)} /></td></tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Bookings ---------------- */
export function AdminBookings() {
  const { t, price, locale } = useI18n();
  const bookings = useStore((s) => s.bookings);
  const setStatus = useStore((s) => s.setBookingStatus);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const list = [...bookings].filter((b) => (!q || `${b.id} ${b.customerName}`.toLowerCase().includes(q.toLowerCase())) && (!st || b.status === st)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title={t("admin.bookings")} subtitle={`${list.length}`} action={<div className="flex flex-col gap-2 sm:flex-row"><Select value={st} onChange={(e) => setSt(e.target.value)} className="h-10 rounded-full"><option value="">{t("common.all")}</option>{["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{t(`dash.status.${s}`)}</option>)}</Select><SearchInput value={q} onChange={setQ} /></div>} />
      <Table head={["ID", t("pdash.customer"), t("booking.specialist"), t("pdash.when"), t("dash.method"), t("common.total"), t("common.status")]} min={960}>
        {list.map((b) => (
          <tr key={b.id}>
            <td className="font-mono text-xs">{b.id}</td><td className="font-medium">{b.customerName}</td><td>{getProviderById(b.providerId)?.name}</td>
            <td className="whitespace-nowrap text-muted-foreground">{formatDate(b.date, locale, { day: "numeric", month: "short" })}, {b.time}</td><td>{t(`booking.methods.${b.paymentMethod}`)}</td>
            <td className="whitespace-nowrap font-semibold">{price(b.total)}</td>
            <td><Select value={b.status} onChange={(e) => setStatus(b.id, e.target.value as BookingStatus)} className="h-9 w-44 rounded-full text-xs">{["pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{t(`dash.status.${s}`)}</option>)}</Select></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Payments ---------------- */
export function AdminPayments() {
  const { t, price, locale } = useI18n();
  const payments = useStore((s) => s.payments);
  const rev = usePlatformRevenue();
  return (
    <div>
      <PageHeader title={t("admin.payments")} action={<Button variant="outline" onClick={() => toast.success("CSV")}><Download />{t("admin.exportCsv")}</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label={t("admin.gmv")} value={price(rev.gmv)} tone="brand" />
        <StatCard icon={Percent} label={`${t("admin.takeRate")} · ${t("admin.revenue")}`} value={price(Math.round(rev.take))} tone="success" />
        <StatCard icon={DollarSign} label={t("admin.mrr")} value={`$${rev.mrrUsd}`} tone="dark" />
      </div>
      <Table head={["ID", t("common.date"), t("admin.plan"), t("dash.method"), t("common.status"), t("common.amount")]}>
        {[...payments].sort((a, b) => b.at.localeCompare(a.at)).map((p) => (
          <tr key={p.id}>
            <td className="font-mono text-xs">{p.bookingId ?? p.id}</td><td className="text-muted-foreground">{formatDate(p.at, locale)}</td>
            <td>{p.kind === "subscription" ? <Badge tone="dark" className="uppercase">{p.subscriptionPlan}</Badge> : <Badge>{t("admin.bookings")}</Badge>}</td>
            <td>{t(`booking.methods.${p.method}`)}</td><td><StatusPill status={p.status === "pending" ? "held" : p.status} /></td>
            <td className="font-semibold">{p.currency === "USD" ? `$${p.amount}` : price(p.amount)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Reviews ---------------- */
export function AdminReviews() {
  const { t, locale } = useI18n();
  const reviews = useReviews({ includeHidden: true });
  const setStatus = useStore((s) => s.setReviewStatus);
  const [q, setQ] = useState("");
  const list = reviews.filter((r) => !q || `${r.author} ${r.text}`.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
  return (
    <div>
      <PageHeader title={t("admin.reviews")} subtitle={`${reviews.length}`} action={<SearchInput value={q} onChange={setQ} />} />
      <Table head={[t("common.name"), t("booking.specialist"), t("admin.rating"), t("review.text"), "Booking", t("common.status"), ""]} min={1000}>
        {list.map((r) => (
          <tr key={r.id}>
            <td className="whitespace-nowrap font-medium">{r.author}<p className="text-xs text-muted-foreground">{formatDate(r.date, locale)}</p></td><td>{getProviderById(r.providerId)?.name}</td><td><Stars value={r.rating} size={12} /></td>
            <td className="max-w-[320px] truncate text-muted-foreground">{r.text}</td><td className="font-mono text-xs">{r.bookingId}</td>
            <td>{r.status === "hidden" ? <Badge>{t("admin.hidden")}</Badge> : r.status === "flagged" ? <Badge tone="warning">{t("admin.flagged")}</Badge> : <Badge tone="success">{t("admin.published")}</Badge>}</td>
            <td className="whitespace-nowrap text-right">
              {r.status === "hidden" ? <Button size="icon-sm" variant="ghost" onClick={() => setStatus(r.id, "published")} aria-label={t("admin.show")}><Eye /></Button> : <Button size="icon-sm" variant="ghost" onClick={() => setStatus(r.id, "hidden")} aria-label={t("admin.hide")}><EyeOff /></Button>}
              <Button size="icon-sm" variant="ghost" onClick={() => setStatus(r.id, "flagged")} aria-label={t("admin.flagged")}><Flag /></Button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Reports ---------------- */
export function AdminReports() {
  const { t, raw } = useI18n();
  const items = raw<{ t: string; who: string; sev: string }[]>("admin.reportItems");
  const [resolved, setResolved] = useState<number[]>([]);
  return (
    <div className="max-w-4xl">
      <PageHeader title={t("admin.reportsTitle")} />
      <div className="space-y-3">
        {items.map((r, i) => (
          <Card key={i} className={cn("flex items-center gap-4 p-5", resolved.includes(i) && "opacity-50")}>
            <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", r.sev === "high" ? "bg-red-50 text-destructive" : r.sev === "medium" ? "bg-warning-soft text-amber-600" : "bg-secondary text-muted-foreground")}><AlertTriangle className="h-5 w-5" /></span>
            <div className="flex-1"><p className="font-semibold">{r.t}</p><p className="text-sm text-muted-foreground">{r.who}</p></div>
            <Badge tone={r.sev === "high" ? "danger" : r.sev === "medium" ? "warning" : "neutral"} className="uppercase">{r.sev}</Badge>
            {!resolved.includes(i) ? <Button size="sm" variant="outline" onClick={() => setResolved([...resolved, i])}><Check />OK</Button> : <CheckCircle2 className="h-5 w-5 text-success" />}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Verification ---------------- */
export function AdminVerification() {
  const { t, tx, price, locale } = useI18n();
  const apps = useStore((s) => s.applications);
  const approve = useStore((s) => s.approveApplication);
  const reject = useStore((s) => s.rejectApplication);
  const sorted = [...apps].sort((a, b) => (a.status === "under_review" ? -1 : 1) - (b.status === "under_review" ? -1 : 1) || b.submittedAt.localeCompare(a.submittedAt));
  return (
    <div className="max-w-5xl">
      <PageHeader title={t("admin.verification")} subtitle={`${apps.filter((a) => a.status === "under_review").length} ${t("admin.pendingVerification").toLowerCase()}`} />
      {sorted.length === 0 ? <EmptyState icon={<ShieldCheck />} title={t("admin.noItems")} /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar src={a.photo} name={a.name} className="h-12 w-12" />
                <div className="flex-1"><p className="font-semibold">{a.name}</p><p className="text-sm text-muted-foreground">{tx(getCategory(a.categoryId)?.name)} · {tx(getCity(a.citySlug)?.name)} · {a.phone}</p></div>
                {a.status === "under_review" ? <Badge tone="warning">{t("reg.underReview").split(" ").slice(-1)[0]}</Badge> : a.status === "approved" ? <Badge tone="success"><BadgeCheck />{t("reg.approved")}</Badge> : <Badge tone="danger">{t("common.reject")}</Badge>}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/60 p-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">{t("reg.services")}</dt><dd className="font-medium">{a.services}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("reg.experience")}</dt><dd className="font-medium">{a.experienceYears}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("reg.price")}</dt><dd className="font-medium">{price(a.priceFrom)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{t("admin.submitted")}</dt><dd className="font-medium">{formatDate(a.submittedAt, locale)}</dd></div>
                <div className="col-span-2 flex items-center gap-2 rounded-xl bg-white p-2.5"><FileText className="h-4 w-4 text-primary" /><span className="flex-1 truncate font-medium">{a.documentName ?? "—"}</span><span className="text-xs text-muted-foreground">{t("admin.document")}</span></div>
              </dl>
              {a.status === "under_review" && (
                <div className="mt-4 flex gap-2">
                  <Button variant="success" className="flex-1" onClick={() => { approve(a.id); toast.success(t("reg.approved")); }}><Check />{t("common.approve")}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => reject(a.id)}><X />{t("common.reject")}</Button>
                </div>
              )}
              {a.status === "approved" && a.providerId && <Button asChild variant="ghost" size="sm" className="mt-3"><Link href={`/provider/${a.providerId}`}><ExternalLink />{t("pdash.publicProfile")}</Link></Button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Promotions ---------------- */
export function AdminPromotions() {
  const { t, locale } = useI18n();
  const promos = useStore((s) => s.promos);
  const addPromo = useStore((s) => s.addPromo);
  const togglePromo = useStore((s) => s.togglePromo);
  const promotedIds = useStore((s) => s.promotedIds);
  const togglePromoted = useStore((s) => s.togglePromoted);
  const [f, setF] = useState({ code: "", percent: 10, maxUses: 500, expiresAt: "2026-12-31" });
  return (
    <div>
      <PageHeader title={t("admin.promotions")} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          <p className="mb-3 font-display text-lg font-semibold">{t("admin.promoTitle")}</p>
          <Table head={[t("admin.code"), t("admin.percent"), t("admin.uses"), t("admin.expires"), t("common.status")]} min={560}>
            {promos.map((p) => (
              <tr key={p.code}><td><span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2 py-1 font-mono text-xs font-bold"><Tag className="h-3 w-3" />{p.code}</span></td><td className="font-semibold">−{p.percent}%</td><td>{p.uses} / {p.maxUses}</td><td className="text-muted-foreground">{formatDate(p.expiresAt, locale)}</td><td><Switch checked={p.active} onCheckedChange={() => togglePromo(p.code)} /></td></tr>
            ))}
          </Table>
        </div>
        <Card className="h-fit p-6">
          <p className="mb-4 font-display text-lg font-semibold">{t("admin.newPromo")}</p>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!f.code) return; addPromo({ code: f.code.toUpperCase(), percent: f.percent, maxUses: f.maxUses, expiresAt: f.expiresAt, active: true, uses: 0 }); toast.success(f.code.toUpperCase()); setF({ ...f, code: "" }); }}>
            <div><Label>{t("admin.code")}</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="uppercase" required /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>{t("admin.percent")}</Label><Input type="number" min={1} max={90} value={f.percent} onChange={(e) => setF({ ...f, percent: Number(e.target.value) })} /></div><div><Label>{t("admin.uses")}</Label><Input type="number" min={1} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: Number(e.target.value) })} /></div></div>
            <div><Label>{t("admin.expires")}</Label><Input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
            <Button type="submit" className="w-full"><Plus />{t("common.create")}</Button>
          </form>
        </Card>
      </div>
      <p className="mb-3 mt-10 font-display text-lg font-semibold">{t("admin.promoted")} · Featured / Sponsored</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {promotedIds.map((id) => { const p = getProviderById(id); if (!p) return null; return (
          <Card key={id} className="flex items-center gap-3 p-4"><Avatar src={p.avatar} name={p.name} className="h-10 w-10" /><div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground"><Rocket className="mr-1 inline h-3 w-3 text-primary" />{t("admin.featured")}</p></div><Button size="sm" variant="ghost" onClick={() => togglePromoted(id)}><X /></Button></Card>); })}
      </div>
    </div>
  );
}

/* ---------------- Monetization ---------------- */
export function AdminMonetization() {
  const { t, locale } = useI18n();
  const planPrices = useStore((s) => s.planPrices);
  const commission = useStore((s) => s.commission);
  const fee = useStore((s) => s.serviceFeePercent);
  const setPlanPrice = useStore((s) => s.setPlanPrice);
  const setCommission = useStore((s) => s.setCommission);
  const setServiceFee = useStore((s) => s.setServiceFee);
  const rev = usePlatformRevenue();
  const bookings = useStore((s) => s.bookings);
  const series = monthlySeries(bookings, locale, { base: 182_000_000, growth: 0.11, seed: 1 }).map((m, i) => ({ label: m.label, commission: Math.round(m.earnings * 0.1), subscriptions: Math.round((1800 + i * 260) * 12650), promotions: Math.round((400 + i * 90) * 12650) }));
  void monthLabel;
  return (
    <div>
      <PageHeader title={t("admin.monetization")} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="mb-5 font-display text-lg font-semibold">{t("admin.plansTitle")}</p>
          <div className="space-y-3">
            {DEFAULT_PLANS.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_120px_120px] items-center gap-3 rounded-2xl border p-3">
                <p className="font-semibold">{t(`plans.names.${p.id}`)}</p>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" min={0} value={planPrices[p.id]} onChange={(e) => setPlanPrice(p.id as PlanId, Number(e.target.value))} className="h-10 pl-7" aria-label={t("admin.priceUsd")} /></div>
                <div className="relative"><Input type="number" min={0} max={50} value={commission[p.id]} onChange={(e) => setCommission(p.id as PlanId, Number(e.target.value))} className="h-10 pr-8" aria-label={t("admin.commissionTitle")} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span></div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{t("admin.priceUsd")} · {t("admin.commissionTitle")} — {t("admin.commissionHint")}</p>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-secondary/60 p-4">
            <div><p className="font-semibold">{t("admin.serviceFeeTitle")}</p><p className="text-xs text-muted-foreground">{t("admin.commissionHint")}</p></div>
            <div className="relative w-28"><Input type="number" min={0} max={20} value={fee} onChange={(e) => setServiceFee(Number(e.target.value))} className="h-10 pr-8" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span></div>
          </div>
          <Button className="mt-5" onClick={() => toast.success(t("admin.changesSaved"))}>{t("admin.saveChanges")}</Button>
        </Card>
        <Card className="p-6">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div><p className="text-xs text-muted-foreground">{t("admin.gmv")}</p><p className="font-display text-xl font-bold">{formatCompact(rev.gmv)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("admin.revenue")}</p><p className="font-display text-xl font-bold">{formatCompact(rev.take)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("admin.mrr")}</p><p className="font-display text-xl font-bold">${rev.mrrUsd}</p></div>
          </div>
          <Bars data={series} keys={[{ key: "commission", name: t("pdash.commission") }, { key: "subscriptions", name: t("admin.plansTitle") }, { key: "promotions", name: t("admin.promotions") }]} stacked height={320} />
        </Card>
      </div>
    </div>
  );
}
