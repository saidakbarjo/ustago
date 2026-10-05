"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Segmented, EmptyState } from "@/components/ui/misc";
import { BookingItem } from "@/components/dashboard/booking-item";
import { ReviewDialog } from "@/components/dashboard/review-dialog";
import { Button } from "@/components/ui/button";

function Inner() {
  const { t } = useI18n();
  const sp = useSearchParams();
  const session = useStore((s) => s.session);
  const all = useStore((s) => s.bookings);
  const [tab, setTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [review, setReview] = useState<string | null>(null);
  useEffect(() => { const r = sp.get("review"); if (r) { setTab("completed"); setReview(r); } }, [sp]);
  const mine = all.filter((b) => b.userId === session?.userId);
  const list = mine.filter((b) => tab === "upcoming" ? ["pending", "confirmed", "in_progress"].includes(b.status) : b.status === tab)
    .sort((a, b) => tab === "upcoming" ? `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`) : `${b.date}`.localeCompare(a.date));
  const count = (k: typeof tab) => mine.filter((b) => k === "upcoming" ? ["pending", "confirmed", "in_progress"].includes(b.status) : b.status === k).length;
  return (
    <div>
      <PageHeader title={t("dash.bookings")} action={<Segmented value={tab} onChange={setTab} options={(["upcoming", "completed", "cancelled"] as const).map((k) => ({ value: k, label: <>{t(`dash.tabs.${k}`)} <span className="text-xs opacity-60">{count(k)}</span></> }))} />} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
          {list.length === 0 ? <EmptyState icon={<CalendarX />} title={t("dash.emptyBookings")} action={<Button asChild><Link href="/search">{t("dash.findPro")}</Link></Button>} />
            : list.map((b) => <BookingItem key={b.id} b={b} onReview={setReview} />)}
        </motion.div>
      </AnimatePresence>
      <ReviewDialog bookingId={review} onClose={() => setReview(null)} />
    </div>
  );
}
export default function BookingsPage() { return <Suspense><Inner /></Suspense>; }
