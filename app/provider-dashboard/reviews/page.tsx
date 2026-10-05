"use client";
import { useState } from "react";
import { BadgeCheck, MessageSquareReply } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { useReviews, useStore } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader, StatCard } from "@/components/layout/dashboard-shell";
import { Card, Stars } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Star, ThumbsUp, Clock, MessageCircle } from "lucide-react";

export default function ProviderReviews() {
  const { t, tx, locale } = useI18n();
  const { provider: p, pid } = useMyProvider();
  const reviews = useReviews({ providerId: pid });
  const replies = useStore((s) => s.reviewReplies);
  const reply = useStore((s) => s.replyToReview);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  if (!p) return null;
  const avg = (k: "quality" | "communication" | "punctuality") => (reviews.reduce((s, r) => s + r[k], 0) / Math.max(1, reviews.length)).toFixed(1);
  return (
    <div className="max-w-4xl">
      <PageHeader title={t("pdash.reviews")} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Star} label={t("pdash.rating")} value={p.rating.toFixed(2)} tone="warning" />
        <StatCard icon={ThumbsUp} label={t("profile.quality")} value={avg("quality")} tone="success" />
        <StatCard icon={MessageCircle} label={t("profile.communication")} value={avg("communication")} tone="brand" />
        <StatCard icon={Clock} label={t("profile.punctuality")} value={avg("punctuality")} tone="violet" />
      </div>
      <div className="space-y-4">
        {reviews.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center gap-3"><Avatar src={r.avatar} name={r.author} className="h-10 w-10" /><div className="flex-1"><p className="font-semibold">{r.author}</p><p className="text-xs text-muted-foreground">{formatDate(r.date, locale)} · {tx(r.serviceName)}</p></div><Stars value={r.rating} /></div>
            <p className="mt-3 text-[15px] text-foreground/80">{r.text}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />{t("review.tied", { id: r.bookingId })}</p>
            {replies[r.id] ? (
              <div className="mt-4 rounded-2xl bg-secondary p-4 text-sm"><p className="mb-1 text-xs font-semibold text-muted-foreground">{p.name} · {t("pdash.replied")}</p>{replies[r.id]}</div>
            ) : open === r.id ? (
              <div className="mt-4 space-y-2"><Textarea className="min-h-[90px]" value={draft[r.id] ?? ""} onChange={(e) => setDraft({ ...draft, [r.id]: e.target.value })} placeholder={t("pdash.replyPlaceholder")} /><Button size="sm" onClick={() => { reply(r.id, draft[r.id] ?? ""); setOpen(null); }} disabled={!draft[r.id]}>{t("pdash.reply")}</Button></div>
            ) : <Button size="sm" variant="ghost" className="mt-3" onClick={() => setOpen(r.id)}><MessageSquareReply />{t("pdash.reply")}</Button>}
          </Card>
        ))}
      </div>
    </div>
  );
}
