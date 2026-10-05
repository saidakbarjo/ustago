"use client";
import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, Clock, Heart, MapPin, MessageCircle, Star, CheckCircle2, Activity, ArrowRight, CalendarDays } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { getProviderById, useProviders, useStore } from "@/lib/store";
import { PageHeader, StatCard, StatusPill } from "@/components/layout/dashboard-shell";
import { Avatar, SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { NotificationList } from "@/components/notifications";
import { ProviderCard } from "@/components/provider-card";
import { ReviewDialog } from "@/components/dashboard/review-dialog";
import { Counter } from "@/components/motion";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const { t, tx, price, locale } = useI18n();
  const router = useRouter();
  const session = useStore((s) => s.session);
  const all = useStore((s) => s.bookings);
  const favorites = useStore((s) => s.favorites);
  const ensureConversation = useStore((s) => s.ensureConversation);
  const providers = useProviders();
  const [review, setReview] = useState<string | null>(null);
  const mine = all.filter((b) => b.userId === session?.userId);
  const upcomingList = mine.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const next = upcomingList[0];
  const completed = mine.filter((b) => b.status === "completed");
  const pendingReviews = completed.filter((b) => !b.reviewed);
  const p = next ? getProviderById(next.providerId) : undefined;
  const svc = p?.services.find((s) => s.id === next?.serviceId);
  const days = next ? Math.max(0, Math.round((new Date(`${next.date}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)) : 0;
  const recommended = providers.filter((x) => !favorites.includes(x.id) && x.citySlug === "tashkent").sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div>
      <PageHeader title={t("dash.welcome", { name: session?.name.split(" ")[0] ?? "" })} subtitle={t("dash.welcomeSub")}
        action={<Button asChild><Link href="/search">{t("dash.findPro")}<ArrowRight /></Link></Button>} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label={t("dash.upcoming")} value={<Counter to={upcomingList.length} duration={0.8} />} tone="brand" />
        <StatCard icon={Activity} label={t("dash.active")} value={<Counter to={mine.filter((b) => b.status === "in_progress" || b.status === "confirmed").length} duration={0.8} />} tone="violet" />
        <StatCard icon={CheckCircle2} label={t("dash.completed")} value={<Counter to={completed.length} duration={0.8} />} tone="success" />
        <StatCard icon={Heart} label={t("dash.saved")} value={<Counter to={favorites.length} duration={0.8} />} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b px-6 py-4"><p className="font-display text-lg font-semibold">{t("dash.upcomingBooking")}</p>{next && <StatusPill status={next.status} />}</div>
          {next && p ? (
            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <div className="relative h-40 md:h-full"><SmartImage src={p.portfolio[0]?.image} alt="" className="h-full w-full" /><div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3 py-2 text-center backdrop-blur"><p className="font-display text-2xl font-bold leading-none">{new Date(`${next.date}T00:00:00`).getDate()}</p><p className="text-[11px] font-semibold uppercase text-muted-foreground">{formatDate(next.date, locale, { month: "short" }).replace(/^\d+-/, "")}</p></div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3"><Avatar src={p.avatar} name={p.name} className="h-12 w-12" /><div><p className="font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{tx(svc?.name)}</p></div></div>
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatDate(next.date, locale, { weekday: "long", day: "numeric", month: "long" })}</span>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap"><Clock className="h-4 w-4 text-primary" />{next.time} · <span className="text-muted-foreground">{days === 0 ? t("common.today") : t("dash.inDays", { n: days })}</span></span>
                  <span className="inline-flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-primary" />{next.address}</span>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => router.push(`/dashboard/messages?c=${ensureConversation(p.id, next.id)}`)}><MessageCircle />{t("dash.chat")}</Button>
                  <Button size="sm" variant="outline" asChild><Link href="/dashboard/bookings">{t("dash.details")}</Link></Button>
                  <span className="ml-auto font-display text-lg font-bold">{price(next.total)}</span>
                </div>
              </div>
            </div>
          ) : <div className="p-6"><EmptyState icon={<CalendarCheck />} title={t("dash.noUpcoming")} action={<Button asChild><Link href="/search">{t("dash.findPro")}</Link></Button>} /></div>}
        </Card>

        <Card className="p-5">
          <p className="mb-3 font-display text-lg font-semibold">{t("dash.recentActivity")}</p>
          <div className="[&_ul]:max-h-[300px] [&_ul]:overflow-y-auto"><NotificationList audience="user" compact /></div>
        </Card>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="mt-6 flex flex-col gap-4 border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-600"><Star className="h-6 w-6 fill-amber-400" /></span>
          <div className="flex-1"><p className="font-semibold">{t("dash.pendingReviews")}</p><p className="text-sm text-muted-foreground">{pendingReviews.map((b) => getProviderById(b.providerId)?.name).join(", ")}</p></div>
          <Button onClick={() => setReview(pendingReviews[0].id)}><Star />{t("dash.leaveReview")}</Button>
        </Card>
      )}

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between"><p className="font-display text-lg font-semibold">{t("top.title")}</p><Link href="/search" className="text-sm font-semibold text-primary">{t("common.viewAll")}</Link></div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recommended.map((r) => <ProviderCard key={r.id} p={r} />)}</div>
      </div>
      <ReviewDialog bookingId={review} onClose={() => setReview(null)} />
    </div>
  );
}
