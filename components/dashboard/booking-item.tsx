"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, MessageCircle, Star, X, RotateCcw, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { getProviderById, useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/layout/dashboard-shell";
import type { Booking } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function BookingItem({ b, onReview }: { b: Booking; onReview?: (id: string) => void }) {
  const { t, tx, price, locale } = useI18n();
  const router = useRouter();
  const p = getProviderById(b.providerId);
  const svc = p?.services.find((s) => s.id === b.serviceId);
  const setStatus = useStore((s) => s.setBookingStatus);
  const ensureConversation = useStore((s) => s.ensureConversation);
  const upcoming = ["pending", "confirmed", "in_progress"].includes(b.status);
  return (
    <div className="rounded-[24px] border bg-white p-4 shadow-soft transition hover:shadow-lift sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link href={`/provider/${b.providerId}`} className="flex flex-1 items-center gap-3">
          <Avatar src={p?.avatar} name={p?.name ?? "?"} className="h-14 w-14" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{tx(svc?.name) || "—"}</p>
            <p className="truncate text-sm text-muted-foreground">{p?.name} · {tx(p?.profession)}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{b.id}</p>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:w-[260px]">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-muted-foreground" />{formatDate(b.date, locale, { day: "numeric", month: "short" })}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground" />{b.time}</span>
          <span className="col-span-2 inline-flex items-center gap-1.5 truncate text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{b.address}</span></span>
        </div>
        <div className="flex items-center justify-between gap-3 sm:w-[190px] sm:flex-col sm:items-end">
          <StatusPill status={b.status} />
          <span className="font-display text-lg font-bold">{price(b.total)}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/messages?c=${ensureConversation(b.providerId, b.id)}`)}><MessageCircle />{t("dash.chat")}</Button>
        {upcoming && <Button size="sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => { setStatus(b.id, "cancelled"); toast.info(t("dash.status.cancelled")); }}><X />{t("dash.cancelBooking")}</Button>}
        {b.status === "completed" && (b.reviewed
          ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 text-sm font-medium text-success"><Check className="h-4 w-4" />{t("dash.reviewed")}</span>
          : <Button size="sm" onClick={() => onReview?.(b.id)}><Star />{t("dash.leaveReview")}</Button>)}
        {(b.status === "completed" || b.status === "cancelled") && <Button size="sm" variant="ghost" asChild><Link href={`/book/${b.providerId}?service=${b.serviceId}`}><RotateCcw />{t("dash.rebook")}</Link></Button>}
      </div>
    </div>
  );
}
