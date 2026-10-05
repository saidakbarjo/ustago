"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { dayLabel } from "@/lib/analytics";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn, ymd } from "@/lib/utils";

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);
const TONE: Record<string, string> = { pending: "border-amber-300 bg-amber-50 text-amber-900", confirmed: "border-brand-300 bg-brand-50 text-brand-900", in_progress: "border-violet-300 bg-violet-50 text-violet-900", completed: "border-emerald-300 bg-emerald-50 text-emerald-900" };

export default function CalendarPage() {
  const { t, tx, locale } = useI18n();
  const { provider: p, bookings } = useMyProvider();
  const [offset, setOffset] = useState(0);
  const days = useMemo(() => {
    const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  }, [offset]);
  const today = ymd(new Date());
  return (
    <div>
      <PageHeader title={t("pdash.calendar")} subtitle={`${formatDate(ymd(days[0]), locale, { day: "numeric", month: "long" })} — ${formatDate(ymd(days[6]), locale, { day: "numeric", month: "long", year: "numeric" })}`}
        action={<div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)} aria-label="prev"><ChevronLeft /></Button><Button variant="outline" onClick={() => setOffset(0)}>{t("common.today")}</Button><Button variant="outline" size="icon" onClick={() => setOffset((o) => o + 1)} aria-label="next"><ChevronRight /></Button></div>} />
      <Card className="overflow-x-auto p-0">
        <div className="grid min-w-[860px] grid-cols-[64px_repeat(7,minmax(0,1fr))]">
          <div className="border-b" />
          {days.map((d) => {
            const off = !p?.availability[d.getDay()];
            return <div key={ymd(d)} className={cn("border-b border-l p-3 text-center", ymd(d) === today && "bg-accent")}><p className="text-xs font-semibold uppercase text-muted-foreground">{dayLabel(d, locale)}</p><p className={cn("font-display text-xl font-bold", ymd(d) === today && "text-primary")}>{d.getDate()}</p>{off && <p className="text-[10px] text-muted-foreground">{t("profile.dayOff")}</p>}</div>;
          })}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="h-16 border-b pr-2 pt-1 text-right text-xs text-muted-foreground">{h}:00</div>
              {days.map((d) => {
                const av = p?.availability[d.getDay()];
                const working = av && h >= av[0] && h < av[1];
                const items = bookings.filter((b) => b.date === ymd(d) && parseInt(b.time) === h && b.status !== "cancelled");
                return (
                  <div key={ymd(d) + h} className={cn("relative h-16 border-b border-l p-1", !working && "bg-[repeating-linear-gradient(135deg,#f8fafc,#f8fafc_6px,#f1f5f9_6px,#f1f5f9_12px)]")}>
                    {items.map((b) => (
                      <div key={b.id} className={cn("h-full overflow-hidden rounded-xl border-l-4 px-2 py-1 text-[11px] leading-tight shadow-sm", TONE[b.status])}>
                        <p className="font-semibold">{b.time} · {b.customerName.split(" ")[0]}</p>
                        <p className="truncate opacity-80">{tx(p?.services.find((s) => s.id === b.serviceId)?.name)}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-4 flex flex-wrap gap-3 text-xs">{Object.keys(TONE).map((k) => <span key={k} className={cn("rounded-full border px-2.5 py-1 font-medium", TONE[k])}>{t(`dash.status.${k}`)}</span>)}</div>
    </div>
  );
}
