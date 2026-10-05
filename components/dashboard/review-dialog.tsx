"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { getProviderById, useStore } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StarInput } from "@/components/ui/misc";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/smart-image";
import { toast } from "@/components/ui/toast";

export function ReviewDialog({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
  const { t, tx } = useI18n();
  const booking = useStore((s) => s.bookings.find((b) => b.id === bookingId));
  const addReview = useStore((s) => s.addReview);
  const [rating, setRating] = useState(5);
  const [crit, setCrit] = useState({ quality: 5, communication: 5, price: 5, punctuality: 5 });
  const [text, setText] = useState("");
  const p = booking ? getProviderById(booking.providerId) : undefined;
  const svc = p?.services.find((s) => s.id === booking?.serviceId);

  const submit = () => {
    if (!booking) return;
    const res = addReview({ bookingId: booking.id, rating, ...crit, text: text.trim() || "👍", serviceName: svc?.name });
    if (res.ok) { toast.success(t("review.thanks")); onClose(); setText(""); }
    else toast.error(res.error ?? "error");
  };

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={t("review.title")} description={t("review.subtitle")}>
        {booking && p && (
          <div className="mt-5 space-y-6">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
              <Avatar src={p.avatar} name={p.name} className="h-11 w-11" />
              <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{tx(svc?.name)}</p></div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Link2 className="h-3.5 w-3.5" />{t("review.tied", { id: booking.id })}</span>
            </div>
            <div className="text-center">
              <p className="mb-2 text-sm font-medium text-muted-foreground">{t("review.overall")}</p>
              <StarInput value={rating} onChange={setRating} size={40} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["quality", "communication", "price", "punctuality"] as const).map((k) => (
                <div key={k} className="rounded-2xl border p-3">
                  <p className="mb-1 text-sm font-medium">{t(`profile.${k}`)}</p>
                  <StarInput value={crit[k]} onChange={(v) => setCrit((c) => ({ ...c, [k]: v }))} size={22} />
                </div>
              ))}
            </div>
            <div><p className="mb-1.5 text-sm font-medium">{t("review.text")}</p><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("review.placeholder")} /></div>
            <motion.div whileTap={{ scale: 0.98 }}><Button className="w-full" size="lg" onClick={submit}>{t("review.submit")}</Button></motion.div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
