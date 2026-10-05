"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, Clock, CreditCard, ImagePlus, Lock, MapPin, MessageCircle, Star, Tag, Trash2, Wallet, X,
  Banknote, PartyPopper, Copy,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { useHydrated, useProvider, useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/misc";
import { Logo } from "@/components/icons";
import { toast } from "@/components/ui/toast";
import type { Booking, PaymentMethod } from "@/lib/types";
import { cn, fileToDataUrl, ymd } from "@/lib/utils";

const PAY: { id: PaymentMethod; icon: typeof CreditCard; color: string }[] = [
  { id: "click", icon: Wallet, color: "bg-sky-500" },
  { id: "payme", icon: Wallet, color: "bg-teal-500" },
  { id: "uzum", icon: Wallet, color: "bg-violet-600" },
  { id: "card", icon: CreditCard, color: "bg-ink" },
  { id: "cash", icon: Banknote, color: "bg-emerald-600" },
];

function Confetti() {
  const pieces = Array.from({ length: 36 });
  const colors = ["#3a55ff", "#8b5cf6", "#16a34a", "#f59e0b", "#ec4899", "#06b6d4"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.span key={i} className="absolute top-0 h-2.5 w-1.5 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length] }}
          initial={{ y: -20, opacity: 1, rotate: 0 }} animate={{ y: 520, opacity: 0, rotate: 360 + i * 20, x: (i % 2 ? 1 : -1) * (20 + (i * 13) % 60) }}
          transition={{ duration: 2.2 + (i % 5) * 0.25, delay: (i % 8) * 0.05, ease: "easeOut" }} />
      ))}
    </div>
  );
}

export function BookingFlow({ id }: { id: string }) {
  const { t, tx, price, locale, raw } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const hydrated = useHydrated();
  const p = useProvider(id);
  const session = useStore((s) => s.session);
  const user = useStore((s) => s.users.find((u) => u.id === (s.session?.userId ?? "u-demo")));
  const bookings = useStore((s) => s.bookings);
  const feePct = useStore((s) => s.serviceFeePercent);
  const createBooking = useStore((s) => s.createBooking);
  const validatePromo = useStore((s) => s.validatePromo);
  const login = useStore((s) => s.login);
  const ensureConversation = useStore((s) => s.ensureConversation);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [serviceId, setServiceId] = useState<string | undefined>(sp.get("service") ?? undefined);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [date, setDate] = useState<string | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("click");
  const [promo, setPromo] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const service = p?.services.find((s) => s.id === serviceId);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const slots = useMemo(() => {
    if (!p || !date) return [];
    const d = new Date(`${date}T00:00:00`);
    const h = p.availability[d.getDay()];
    if (!h) return [];
    const taken = new Set(bookings.filter((b) => b.providerId === p.id && b.date === date && b.status !== "cancelled").map((b) => b.time));
    const now = new Date();
    const out: { time: string; free: boolean }[] = [];
    for (let hr = h[0]; hr < h[1]; hr++) for (const m of [0, 30]) {
      const tm = `${String(hr).padStart(2, "0")}:${m ? "30" : "00"}`;
      const past = date === ymd(now) && (hr < now.getHours() + 1);
      const busy = ((hr * 7 + d.getDate() * 3 + m) % 5 === 0);
      out.push({ time: tm, free: !past && !busy && !taken.has(tm) });
    }
    return out;
  }, [p, date, bookings]);

  if (!p) return <div className="grid min-h-screen place-items-center">{t("profile.notFound")}</div>;

  const priceVal = service?.price ?? 0;
  const fee = Math.round((priceVal * feePct) / 100 / 1000) * 1000;
  const discount = Math.round(((priceVal + fee) * discountPct) / 100 / 1000) * 1000;
  const total = priceVal + fee - discount;
  const steps = raw<string[]>("booking.steps");

  const canNext = [!!service, description.trim().length >= 10 && address.trim().length >= 5, true, !!date, !!time, true][step];
  const next = () => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (description.trim().length < 10) e.description = t("booking.requiredDescribe");
      if (address.trim().length < 5) e.address = t("booking.requiredAddress");
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 4 && !name) { setName(session?.name ?? user?.name ?? ""); setPhone(user?.phone ?? ""); }
    setDir(1); setStep((s) => Math.min(5, s + 1));
  };
  const back = () => { setDir(-1); setStep((s) => Math.max(0, s - 1)); };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const arr = await Promise.all(Array.from(files).slice(0, 6 - photos.length).map((f) => fileToDataUrl(f, 640)));
    setPhotos((p) => [...p, ...arr].slice(0, 6));
  };

  const applyPromo = () => {
    const pct = validatePromo(promo);
    if (pct) { setDiscountPct(pct); toast.success(t("booking.promoApplied", { p: pct })); } else { setDiscountPct(0); toast.error(t("booking.promoInvalid")); }
  };

  const confirm = async () => {
    if (!service || !date || !time) return;
    setSubmitting(true);
    if (!session) login({ role: "customer", name: name || undefined, phone: phone || undefined });
    await new Promise((r) => setTimeout(r, 900));
    const b = createBooking({
      providerId: p.id, customerName: name || user?.name || "Customer", customerPhone: phone || user?.phone || "", serviceId: service.id,
      description, photos, date, time, address, citySlug: p.citySlug, price: priceVal, fee, discount, total,
      promoCode: discountPct ? promo.toUpperCase() : undefined, paymentMethod: method,
    });
    setSubmitting(false);
    setDone(b);
  };

  /* ---------------- success ---------------- */
  if (done) {
    return (
      <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,#eef2ff,#fff_60%)]">
        <Confetti />
        <div className="container max-w-xl py-14">
          <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] bg-success text-white shadow-[0_24px_60px_-18px_rgba(22,163,74,.7)]">
            <motion.svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} />
            </motion.svg>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 text-center">
            <h1 className="flex items-center justify-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl"><PartyPopper className="h-8 w-8 text-amber-500" />{t("booking.confirmed")}</h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t("booking.confirmedText", { name: p.name })}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="mt-8 overflow-hidden p-0 shadow-lift">
              <div className="flex items-center gap-3 border-b p-5">
                <Avatar src={p.avatar} name={p.name} className="h-12 w-12" />
                <div className="flex-1"><p className="text-xs text-muted-foreground">{t("booking.specialist")}</p><p className="flex items-center gap-1 font-semibold">{p.name}<BadgeCheck className="h-4 w-4 fill-success text-white" /></p></div>
                <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-amber-700">{t("dash.status.pending")}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 text-sm">
                <div><dt className="text-muted-foreground">{t("booking.bookingId")}</dt><dd className="mt-0.5 flex items-center gap-1.5 font-mono font-semibold">{done.id}<button onClick={() => { void navigator.clipboard?.writeText(done.id); toast.success(t("common.copied")); }} aria-label="copy"><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button></dd></div>
                <div><dt className="text-muted-foreground">{t("pdash.service")}</dt><dd className="mt-0.5 font-semibold">{tx(service?.name)}</dd></div>
                <div><dt className="text-muted-foreground">{t("booking.date")}</dt><dd className="mt-0.5 font-semibold">{formatDate(done.date, locale, { weekday: "short", day: "numeric", month: "long" })}</dd></div>
                <div><dt className="text-muted-foreground">{t("booking.time")}</dt><dd className="mt-0.5 font-semibold">{done.time}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">{t("booking.address")}</dt><dd className="mt-0.5 font-semibold">{done.address}</dd></div>
                <div className="col-span-2 flex items-center justify-between rounded-2xl bg-secondary p-4"><dt className="font-medium">{t("booking.price")}</dt><dd className="font-display text-xl font-bold">{price(done.total)}</dd></div>
              </dl>
            </Card>
          </motion.div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg"><Link href="/dashboard/bookings">{t("booking.goDashboard")}</Link></Button>
            <Button size="lg" variant="outline" onClick={() => { const c = ensureConversation(p.id, done.id); router.push(`/dashboard/messages?c=${c}`); }}><MessageCircle />{t("booking.messageProvider")}</Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4 text-success" />{t("booking.protection")}</p>
        </div>
      </div>
    );
  }

  /* ---------------- steps ---------------- */
  const Summary = (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar src={p.avatar} name={p.name} className="h-12 w-12" />
        <div className="min-w-0"><p className="flex items-center gap-1 font-semibold">{p.name}{p.verified && <BadgeCheck className="h-4 w-4 fill-success text-white" />}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating} · {tx(p.profession)}</p></div>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("booking.summary")}</p>
      <ul className="mt-3 space-y-2.5 text-sm">
        <li className="flex items-start gap-2.5"><Check className={cn("mt-0.5 h-4 w-4", service ? "text-success" : "text-border")} /><span className={cn(!service && "text-muted-foreground")}>{service ? tx(service.name) : t("booking.selectService")}</span></li>
        <li className="flex items-start gap-2.5"><CalendarDays className={cn("mt-0.5 h-4 w-4", date ? "text-success" : "text-border")} /><span className={cn(!date && "text-muted-foreground")}>{date ? formatDate(date, locale, { weekday: "short", day: "numeric", month: "long" }) : t("booking.selectDate")}</span></li>
        <li className="flex items-start gap-2.5"><Clock className={cn("mt-0.5 h-4 w-4", time ? "text-success" : "text-border")} /><span className={cn(!time && "text-muted-foreground")}>{time ?? t("booking.selectTime")}</span></li>
        {address && <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 text-success" /><span className="line-clamp-2">{address}</span></li>}
      </ul>
      {service && (
        <div className="mt-5 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.servicePrice")}</span><span className="font-medium">{price(priceVal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.serviceFee")} ({feePct}%)</span><span className="font-medium">{price(fee)}</span></div>
          {discount > 0 && <div className="flex justify-between text-success"><span>{t("booking.discount")} (−{discountPct}%)</span><span className="font-medium">−{price(discount)}</span></div>}
          <div className="flex items-center justify-between border-t pt-3"><span className="font-semibold">{t("booking.total")}</span><motion.span key={total} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-display text-xl font-bold">{price(total)}</motion.span></div>
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-xs font-medium text-success"><Lock className="h-3.5 w-3.5" />{t("booking.protection")}</p>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f8ff_0%,#fff_40%)]">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/"><Logo /></Link>
          <p className="hidden font-display font-semibold sm:block">{t("booking.title")}</p>
          <Link href={`/provider/${p.id}`} className="grid h-10 w-10 place-items-center rounded-full border bg-white" aria-label={t("common.close")}><X className="h-4 w-4" /></Link>
        </div>
        {/* progress */}
        <div className="container pb-3">
          <ol className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <li key={s} className="flex flex-1 flex-col gap-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} transition={{ duration: 0.5 }} /></div>
                <span className={cn("hidden text-[11px] font-medium sm:block", i <= step ? "text-foreground" : "text-muted-foreground")}>{String(i + 1).padStart(2, "0")} · {s}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="container grid gap-8 py-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-12">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{step + 1} / 6</p>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              {step === 0 && (
                <div>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{t("booking.selectService")}</h1>
                  <div className="mt-6 grid gap-3">
                    {p.services.map((s) => (
                      <button key={s.id} onClick={() => setServiceId(s.id)} className={cn("flex items-center gap-4 rounded-[22px] border bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift", serviceId === s.id && "border-primary ring-4 ring-primary/10")}>
                        <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition", serviceId === s.id ? "border-primary bg-primary text-white" : "border-border")}>{serviceId === s.id && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
                        <div className="flex-1"><p className="font-semibold">{tx(s.name)}</p><p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{t("profile.duration", { n: s.durationMin })}</p></div>
                        <div className="text-right"><p className="font-display text-lg font-bold">{price(s.price)}</p><p className="text-xs text-muted-foreground">{t(`units.${s.unit}`)}</p></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 1 && (
                <div>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{t("booking.describe")}</h1>
                  <div className="mt-6 space-y-5">
                    <div>
                      <Textarea value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} placeholder={t("booking.describePlaceholder")} className={cn("min-h-[160px] text-[15px]", errors.description && "border-destructive")} autoFocus />
                      <div className="mt-1.5 flex justify-between text-xs"><span className="text-destructive">{errors.description}</span><span className="text-muted-foreground">{t("booking.charCount", { n: description.length })}</span></div>
                    </div>
                    <div>
                      <Label>{t("booking.address")}</Label>
                      <div className="relative"><MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("booking.addressPlaceholder")} className={cn("pl-10", errors.address && "border-destructive")} /></div>
                      {errors.address && <p className="mt-1.5 text-xs text-destructive">{errors.address}</p>}
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{t("booking.uploadPhotos")} <span className="text-base font-medium text-muted-foreground">({t("common.optional")})</span></h1>
                  <p className="mt-2 text-muted-foreground">{t("booking.uploadHint")}</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                  <button onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void addPhotos(e.dataTransfer.files); }}
                    className="mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed bg-white py-12 text-muted-foreground transition hover:border-primary/50 hover:bg-accent/40">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><ImagePlus className="h-6 w-6" /></span>
                    <span className="font-medium text-foreground">{t("booking.dropHere")}</span>
                    <span className="text-xs">JPG, PNG · {photos.length}/6</span>
                  </button>
                  {photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {photos.map((src, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="group relative aspect-square overflow-hidden rounded-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 opacity-0 transition group-hover:opacity-100" aria-label={t("common.delete")}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {step === 3 && (
                <div>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{t("booking.selectDate")}</h1>
                  <div className="mt-6 grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                    {days.map((d) => {
                      const off = !p.availability[d.getDay()];
                      const v = ymd(d);
                      return (
                        <button key={v} disabled={off} onClick={() => { setDate(v); setTime(undefined); }}
                          className={cn("flex flex-col items-center rounded-[20px] border bg-white px-2 py-3.5 transition", off ? "cursor-not-allowed opacity-40" : "hover:-translate-y-0.5 hover:shadow-soft", date === v && "border-primary bg-primary text-white shadow-glow hover:shadow-glow")}>
                          <span className={cn("text-xs font-medium", date === v ? "text-white/80" : "text-muted-foreground")}>{raw<string[]>("profile.weekdays")[d.getDay()]}</span>
                          <span className="mt-1 font-display text-2xl font-bold">{d.getDate()}</span>
                          <span className={cn("text-[11px]", date === v ? "text-white/80" : "text-muted-foreground")}>{hydrated ? formatDate(v, locale, { month: "short" }).replace(/^\d+-/, "") : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{t("booking.selectTime")}</h1>
                  <p className="mt-2 text-muted-foreground">{date && formatDate(date, locale, { weekday: "long", day: "numeric", month: "long" })}</p>
                  {slots.filter((s) => s.free).length === 0 ? <p className="mt-6 rounded-2xl bg-warning-soft p-4 text-sm text-amber-800">{t("booking.noSlots")}</p> : (
                    <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                      {slots.map((s) => (
                        <button key={s.time} disabled={!s.free} onClick={() => setTime(s.time)}
                          className={cn("rounded-2xl border bg-white py-3 text-sm font-semibold transition", !s.free ? "cursor-not-allowed text-muted-foreground/50 line-through" : "hover:border-primary/50", time === s.time && "border-primary bg-primary text-white shadow-glow")}>
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {step === 5 && (
                <div>
                  <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{steps[5]}</h1>
                  {session && <p className="mt-2 text-sm text-muted-foreground">{t("booking.loginHint", { name: session.name })}</p>}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div><Label>{t("auth.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div><Label>{t("booking.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 000 00 00" inputMode="tel" /></div>
                  </div>
                  <p className="mb-3 mt-8 font-semibold">{t("booking.payment")}</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {PAY.map((m) => (
                      <button key={m.id} onClick={() => setMethod(m.id)} className={cn("flex items-center gap-3 rounded-[18px] border bg-white p-4 text-left transition hover:shadow-soft", method === m.id && "border-primary ring-4 ring-primary/10")}>
                        <span className={cn("grid h-10 w-10 place-items-center rounded-xl text-white", m.color)}><m.icon className="h-5 w-5" /></span>
                        <span className="flex-1 font-semibold">{t(`booking.methods.${m.id}`)}</span>
                        <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2", method === m.id ? "border-primary bg-primary" : "border-border")}>{method === m.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Label>{t("booking.promo")}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1"><Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="USTAGO10" className="pl-10 uppercase" /></div>
                      <Button variant="outline" onClick={applyPromo} disabled={!promo}>{t("booking.apply")}</Button>
                    </div>
                  </div>
                  <div className="mt-6 lg:hidden">{Summary}</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="sticky bottom-0 z-30 -mx-4 mt-10 flex items-center justify-between gap-3 border-t bg-white/90 px-4 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <Button variant="ghost" onClick={back} disabled={step === 0}><ArrowLeft />{t("common.back")}</Button>
            {step < 5 ? (
              <Button size="lg" onClick={next} disabled={!canNext && step !== 1}>{t("common.next")}<ArrowRight /></Button>
            ) : (
              <Button size="lg" onClick={confirm} disabled={submitting} className="min-w-[220px]">
                {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />{t("booking.confirming")}</> : <><Lock />{t("booking.confirm")} · {price(total)}</>}
              </Button>
            )}
          </div>
        </div>
        <aside className="hidden lg:block"><div className="sticky top-[150px]">{Summary}</div></aside>
      </div>
    </div>
  );
}
