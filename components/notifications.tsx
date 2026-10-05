"use client";
import Link from "next/link";
import { useState } from "react";
import { BellOff, CalendarCheck, CheckCheck, CreditCard, MessageCircle, Star, BadgeCheck, Clock, Inbox, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { relativeTime } from "@/lib/i18n";
import { useHydrated, useStore } from "@/lib/store";
import type { NotificationKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/ui/misc";

const ICON: Record<NotificationKind, { icon: typeof Star; tone: string }> = {
  booking_confirmed: { icon: CalendarCheck, tone: "bg-success-soft text-success" },
  booking_created: { icon: CalendarCheck, tone: "bg-accent text-primary" },
  message: { icon: MessageCircle, tone: "bg-accent text-primary" },
  reminder: { icon: Clock, tone: "bg-warning-soft text-amber-600" },
  review_published: { icon: Star, tone: "bg-amber-50 text-amber-500" },
  booking_completed: { icon: CheckCheck, tone: "bg-success-soft text-success" },
  verification_approved: { icon: BadgeCheck, tone: "bg-success-soft text-success" },
  verification_submitted: { icon: ShieldCheck, tone: "bg-accent text-primary" },
  new_request: { icon: Inbox, tone: "bg-accent text-primary" },
  payment: { icon: CreditCard, tone: "bg-success-soft text-success" },
};

export function NotificationList({ audience, compact }: { audience: "user" | "provider" | "admin"; compact?: boolean }) {
  const { t, locale } = useI18n();
  const hydrated = useHydrated();
  const all = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const list = hydrated ? all.filter((n) => n.audience === audience && (filter === "all" || !n.read)) : [];

  return (
    <div>
      <div className={cn("flex items-center justify-between gap-3", compact ? "border-b px-4 py-3" : "mb-4")}>
        {compact ? <p className="font-display font-semibold">{t("notif.title")}</p> : (
          <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: t("notif.all") }, { value: "unread", label: t("notif.unread") }]} />
        )}
        <button onClick={() => markAll(audience)} className="text-xs font-semibold text-primary hover:underline">{t("notif.markAll")}</button>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground"><BellOff className="h-6 w-6" />{t("notif.empty")}</div>
      ) : (
        <ul className={cn(compact ? "max-h-[420px] overflow-y-auto p-1.5" : "space-y-2")}>
          {list.slice(0, compact ? 8 : 100).map((n) => {
            const I = ICON[n.kind];
            const Body = (
              <div className={cn("flex items-start gap-3 rounded-2xl p-3 transition hover:bg-secondary", !compact && "border bg-white hover:bg-white hover:shadow-soft", !n.read && (compact ? "bg-accent/50" : "border-primary/20"))}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", I.tone)}><I.icon className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm leading-snug", !n.read && "font-semibold")}>{t(`notif.${n.kind}`, n.params)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(n.at, locale)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
            );
            return <li key={n.id} onClick={() => markRead(n.id)}>{n.href ? <Link href={n.href}>{Body}</Link> : Body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
