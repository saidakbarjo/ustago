"use client";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, Play, X, CheckCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function OrderActions({ b, compact }: { b: Booking; compact?: boolean }) {
  const { t } = useI18n();
  const setStatus = useStore((s) => s.setBookingStatus);
  const convs = useStore((s) => s.conversations);
  const router = useRouter();
  const act = (s: Booking["status"], msg: string) => { setStatus(b.id, s); toast.success(msg); };
  const conv = convs.find((c) => c.providerId === b.providerId && c.userId === b.userId);
  return (
    <div className="flex flex-wrap gap-2">
      {b.status === "pending" && <>
        <Button size="sm" variant="success" onClick={() => act("confirmed", t("dash.status.confirmed"))}><Check />{t("pdash.accept")}</Button>
        <Button size="sm" variant="outline" onClick={() => act("cancelled", t("dash.status.cancelled"))}><X />{!compact && t("pdash.decline")}</Button>
      </>}
      {b.status === "confirmed" && <Button size="sm" onClick={() => act("in_progress", t("dash.status.in_progress"))}><Play />{t("pdash.start")}</Button>}
      {b.status === "in_progress" && <Button size="sm" variant="success" onClick={() => act("completed", t("dash.status.completed"))}><CheckCheck />{t("pdash.complete")}</Button>}
      {conv && !compact && <Button size="sm" variant="ghost" onClick={() => router.push(`/provider-dashboard/messages?c=${conv.id}`)}><MessageCircle />{t("dash.chat")}</Button>}
    </div>
  );
}
