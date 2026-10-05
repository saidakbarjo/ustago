"use client";
import { useState } from "react";
import { ClipboardList, MapPin, Phone, Image as ImageIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader, StatusPill } from "@/components/layout/dashboard-shell";
import { Card, EmptyState } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/smart-image";
import { OrderActions } from "@/components/dashboard/order-actions";
import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: (BookingStatus | "all")[] = ["pending", "confirmed", "in_progress", "completed", "cancelled", "all"];

export default function OrdersPage() {
  const { t, tx, price, locale } = useI18n();
  const { provider: p, bookings } = useMyProvider();
  const users = useStore((s) => s.users);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const list = bookings.filter((b) => tab === "all" || b.status === tab).sort((a, b) => tab === "completed" || tab === "cancelled" ? b.date.localeCompare(a.date) : `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <div>
      <PageHeader title={t("pdash.orders")} />
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        {TABS.map((k) => {
          const n = bookings.filter((b) => k === "all" || b.status === k).length;
          return <button key={k} onClick={() => setTab(k)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition", tab === k ? "border-ink bg-ink text-white" : "bg-white hover:border-foreground/20")}>{k === "all" ? t("common.all") : t(`dash.status.${k}`)}<span className={cn("rounded-full px-1.5 text-xs", tab === k ? "bg-white/20" : "bg-secondary")}>{n}</span></button>;
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-4 xl:grid-cols-2">
          {list.length === 0 ? <div className="xl:col-span-2"><EmptyState icon={<ClipboardList />} title={t("pdash.noOrders")} /></div> : list.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar src={users.find((u) => u.id === b.userId)?.avatar} name={b.customerName} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{b.customerName}</p><StatusPill status={b.status} /></div>
                  <p className="text-sm text-muted-foreground">{tx(p?.services.find((s) => s.id === b.serviceId)?.name)} · <span className="font-mono text-xs">{b.id}</span></p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/60 p-3 text-sm">
                <div><p className="text-xs text-muted-foreground">{t("pdash.when")}</p><p className="font-semibold">{formatDate(b.date, locale, { weekday: "short", day: "numeric", month: "short" })}, {b.time}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground">{t("booking.price")}</p><p className="font-display font-bold">{price(b.price)}</p></div>
                <p className="col-span-2 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{b.address}</p>
                {b.customerPhone && <p className="col-span-2 flex items-center gap-1.5 text-muted-foreground"><Phone className="h-4 w-4" />{b.customerPhone}</p>}
              </div>
              {b.description && <p className="mt-3 text-sm text-foreground/80">“{b.description}”</p>}
              {b.photos.length > 0 && <div className="mt-3 flex gap-2">{b.photos.map((src, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={src} alt="" className="h-14 w-14 rounded-xl object-cover" />)}<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ImageIcon className="h-3.5 w-3.5" />{b.photos.length}</span></div>}
              <div className="mt-4 border-t pt-4"><OrderActions b={b} /></div>
            </Card>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
