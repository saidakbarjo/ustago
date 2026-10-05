"use client";
import Link from "next/link";
import { useState } from "react";
import { MessageSquareQuote, Star, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { getProviderById, useStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { EmptyState, Stars, Card } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { ReviewDialog } from "@/components/dashboard/review-dialog";

export default function MyReviews() {
  const { t, tx, locale } = useI18n();
  const session = useStore((s) => s.session);
  const allReviews = useStore((s) => s.reviews);
  const allBookings = useStore((s) => s.bookings);
  const reviews = allReviews.filter((r) => r.userId === session?.userId);
  const pending = allBookings.filter((b) => b.userId === session?.userId && b.status === "completed" && !b.reviewed);
  const [review, setReview] = useState<string | null>(null);
  return (
    <div>
      <PageHeader title={t("dash.reviews")} />
      {pending.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">{t("dash.pendingReviews")}</p>
          {pending.map((b) => { const p = getProviderById(b.providerId); return (
            <Card key={b.id} className="flex items-center gap-4 p-4">
              <Avatar src={p?.avatar} name={p?.name ?? ""} className="h-12 w-12" />
              <div className="flex-1"><p className="font-semibold">{p?.name}</p><p className="text-sm text-muted-foreground">{formatDate(b.date, locale)} · {b.id}</p></div>
              <Button size="sm" onClick={() => setReview(b.id)}><Star />{t("dash.leaveReview")}</Button>
            </Card>); })}
        </div>
      )}
      {reviews.length === 0 ? <EmptyState icon={<MessageSquareQuote />} title={t("dash.emptyReviews")} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => { const p = getProviderById(r.providerId); return (
            <Card key={r.id} className="p-5">
              <Link href={`/provider/${r.providerId}`} className="flex items-center gap-3"><Avatar src={p?.avatar} name={p?.name ?? ""} className="h-10 w-10" /><div className="flex-1"><p className="font-semibold">{p?.name}</p><p className="text-xs text-muted-foreground">{tx(r.serviceName)} · {formatDate(r.date, locale)}</p></div><Stars value={r.rating} /></Link>
              <p className="mt-3 text-[15px] text-foreground/80">{r.text}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{(["quality", "communication", "price", "punctuality"] as const).map((k) => <span key={k} className="rounded-full bg-secondary px-2 py-1">{t(`profile.${k}`)} {r[k]}★</span>)}</div>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />{t("review.tied", { id: r.bookingId })}</p>
            </Card>); })}
        </div>
      )}
      <ReviewDialog bookingId={review} onClose={() => setReview(null)} />
    </div>
  );
}
