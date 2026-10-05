"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, BadgeCheck, Briefcase, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Globe2, Images, Lock, MapPin, MessageCircle,
  Phone, Share2, ShieldCheck, Star, Zap, CalendarCheck, Award,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { getCategory, getCity } from "@/lib/data/catalog";
import { useProvider, useReviews, useStore, useHydrated, useProviders } from "@/lib/store";
import { formatDate } from "@/lib/i18n";
import { Avatar, SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Card, Stars, EmptyState } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FavoriteButton, ProviderBadge, ProviderCard } from "@/components/provider-card";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false, loading: () => <div className="skeleton h-full w-full" /> });

export function ProfileClient({ id }: { id: string }) {
  const { t, tx, price, locale, raw } = useI18n();
  const p = useProvider(id);
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useStore((s) => s.session);
  const ensureConversation = useStore((s) => s.ensureConversation);
  const reviews = useReviews({ providerId: id });
  const all = useProviders();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [reviewsShown, setReviewsShown] = useState(4);
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const breakdown = useMemo(() => {
    const n = Math.max(reviews.length, 1);
    const avg = (k: "quality" | "communication" | "price" | "punctuality") => reviews.reduce((s, r) => s + r[k], 0) / n;
    const dist = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length / n);
    return { quality: avg("quality"), communication: avg("communication"), price: avg("price"), punctuality: avg("punctuality"), dist };
  }, [reviews]);

  if (!p) return <div className="container py-24"><EmptyState icon={<Briefcase />} title={t("profile.notFound")} action={<Button asChild><Link href="/search">{t("nav.find")}</Link></Button>} /></div>;
  const city = getCity(p.citySlug);
  const cat = getCategory(p.categoryId);
  const similar = all.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).sort((a, b) => (a.citySlug === p.citySlug ? -1 : 1) - (b.citySlug === p.citySlug ? -1 : 1) || b.rating - a.rating).slice(0, 4);
  const bookHref = `/book/${p.id}${selected ? `?service=${selected}` : ""}`;
  const today = new Date().getDay();

  const message = () => {
    if (!session) { router.push(`/login?next=/provider/${p.id}`); return; }
    const c = ensureConversation(p.id);
    router.push(`/dashboard/messages?c=${c}`);
  };
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: p.name, url }); else { await navigator.clipboard.writeText(url); toast.success(t("common.copied")); } } catch { /* cancelled */ }
  };

  const sections = [
    { id: "about", label: t("profile.about") }, { id: "services", label: t("profile.services") }, { id: "portfolio", label: t("profile.portfolio") },
    { id: "reviews", label: t("profile.reviews") }, { id: "availability", label: t("profile.availability") }, { id: "location", label: t("profile.location") },
  ];

  return (
    <div className="pb-28 md:pb-16">
      <div className="container pt-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t("common.back")}</button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={share}><Share2 />{t("profile.share")}</Button>
            <FavoriteButton id={p.id} className="h-9 w-9 border" />
          </div>
        </div>

        {/* gallery header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid h-[240px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[28px] sm:h-[380px]">
          {p.portfolio.slice(0, 3).map((it, i) => (
            <button key={it.id} onClick={() => setLightbox(i)} className={cn("group relative overflow-hidden", i === 0 ? "col-span-4 row-span-2 sm:col-span-2" : "hidden sm:col-span-2 sm:row-span-1 sm:block lg:col-span-2")}>
              <SmartImage src={it.image} alt={tx(it.title)} loading="eager" className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            </button>
          ))}
        </motion.div>

        <div className="mt-8 grid gap-10 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {/* identity */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative w-fit">
                <Avatar src={p.avatar} name={p.name} className="h-24 w-24 ring-4 ring-white shadow-lift sm:h-28 sm:w-28" />
                {p.verified && <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-success ring-4 ring-white"><Check className="h-4 w-4 text-white" strokeWidth={3} /></span>}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{p.name}</h1>
                  {p.verified && <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success"><BadgeCheck className="h-3.5 w-3.5" />{t("badge.verified")}</span>}
                </div>
                <p className="mt-1 text-lg text-muted-foreground">{tx(p.profession)} · {tx(cat?.name)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <a href="#reviews" className="inline-flex items-center gap-1.5 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{p.rating.toFixed(2).replace(/0$/, "")}<span className="font-normal text-muted-foreground underline-offset-2 hover:underline">({p.reviewsCount} {t("card.reviews")})</span></a>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{p.district}, {tx(city?.name)}</span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Award className="h-4 w-4" />{t("profile.experience")}: {t("profile.years", { n: p.experienceYears })}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">{p.badges.map((b) => <ProviderBadge key={b} b={b} />)}</div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Briefcase, v: p.ordersCount.toLocaleString("ru-RU").replace(/ /g, " "), l: t("profile.completed") },
                { icon: Zap, v: `~${p.responseMinutes} ${t("common.min")}`, l: t("profile.responseTime") },
                { icon: Star, v: `${p.rating.toFixed(1)} / 5`, l: t("profile.basedOn", { n: p.reviewsCount }) },
                { icon: CalendarDays, v: String(p.joinedYear), l: t("profile.memberSince", { y: p.joinedYear }) },
              ].map((s) => (
                <div key={s.l} className="rounded-[20px] border bg-white p-4 shadow-soft">
                  <s.icon className="h-[18px] w-[18px] text-primary" />
                  <p className="mt-3 font-display text-xl font-bold">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>

            {/* section nav */}
            <nav className="sticky top-[68px] z-30 -mx-4 mt-10 border-b bg-white/85 px-4 backdrop-blur-xl sm:mx-0 sm:px-0">
              <ul className="flex gap-1 overflow-x-auto scrollbar-none">
                {sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="block whitespace-nowrap border-b-2 border-transparent px-3 py-3.5 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground">{s.label}</a></li>)}
              </ul>
            </nav>

            <section id="about" className="scroll-mt-32 pt-10">
              <h2 className="font-display text-2xl font-bold">{t("profile.about")}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-foreground/80">{tx(p.about)}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-[20px] border bg-white p-4"><Globe2 className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t("profile.languages")}</p><p className="text-sm font-semibold">{p.languages.map((l) => t(`profile.langNames.${l}`)).join(", ")}</p></div></div>
                {p.verified && <div className="flex items-center gap-3 rounded-[20px] border border-success/20 bg-success-soft/60 p-4"><ShieldCheck className="h-5 w-5 text-success" /><div><p className="text-sm font-semibold">{t("profile.verifiedTitle")}</p><p className="text-xs text-muted-foreground">{t("profile.verifiedText")}</p></div></div>}
              </div>
            </section>

            <section id="services" className="scroll-mt-32 pt-12">
              <h2 className="font-display text-2xl font-bold">{t("profile.services")}</h2>
              <div className="mt-5 divide-y overflow-hidden rounded-[24px] border bg-white shadow-soft">
                {p.services.map((s) => (
                  <label key={s.id} className={cn("flex cursor-pointer items-center gap-4 p-4 transition hover:bg-secondary/50 sm:p-5", selected === s.id && "bg-accent/60")}>
                    <input type="radio" name="svc" className="peer sr-only" checked={selected === s.id} onChange={() => setSelected(s.id)} />
                    <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border-2", selected === s.id ? "border-primary bg-primary" : "border-border")}>{selected === s.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>
                    <div className="min-w-0 flex-1"><p className="font-semibold">{tx(s.name)}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{t("profile.duration", { n: s.durationMin })}</p></div>
                    <div className="text-right"><p className="whitespace-nowrap font-display font-bold">{price(s.price)}</p><p className="text-xs text-muted-foreground">{t(`units.${s.unit}`)}</p></div>
                  </label>
                ))}
              </div>
            </section>

            <section id="portfolio" className="scroll-mt-32 pt-12">
              <div className="flex items-end justify-between"><h2 className="font-display text-2xl font-bold">{t("profile.portfolio")}</h2><span className="text-sm text-muted-foreground">{t("profile.recentWork")} · {p.portfolio.length}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {p.portfolio.map((it, i) => (
                  <motion.button key={it.id} whileHover={{ y: -4 }} onClick={() => setLightbox(i)} className="group relative aspect-[4/5] overflow-hidden rounded-[22px] text-left">
                    <SmartImage src={it.image} alt={tx(it.title)} className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-80 transition group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <p className="font-semibold">{tx(it.title)}</p>
                      <p className="flex items-center gap-1 text-xs text-white/75"><CalendarCheck className="h-3.5 w-3.5" />{hydrated ? formatDate(it.completedAt, locale) : ""}</p>
                    </div>
                    <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 transition group-hover:opacity-100"><Images className="h-4 w-4" /></span>
                  </motion.button>
                ))}
              </div>
            </section>

            <section id="reviews" className="scroll-mt-32 pt-12">
              <h2 className="font-display text-2xl font-bold">{t("profile.reviews")}</h2>
              <div className="mt-5 grid gap-6 rounded-[24px] border bg-white p-6 shadow-soft md:grid-cols-[200px_1fr_1fr]">
                <div>
                  <p className="font-display text-6xl font-bold tracking-tight">{p.rating.toFixed(1)}</p>
                  <Stars value={p.rating} size={18} className="mt-2" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("profile.basedOn", { n: p.reviewsCount })}</p>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((s, i) => (
                    <div key={s} className="flex items-center gap-3 text-sm">
                      <span className="w-3 text-muted-foreground">{s}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><motion.div initial={{ width: 0 }} whileInView={{ width: `${breakdown.dist[i] * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.05 }} className="h-full rounded-full bg-amber-400" /></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {(["quality", "communication", "price", "punctuality"] as const).map((k) => (
                    <div key={k} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t(`profile.${k}`)}</span>
                      <span className="flex items-center gap-2 font-semibold"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-primary" style={{ width: `${(breakdown[k] / 5) * 100}%` }} /></span>{breakdown[k].toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="mt-5 grid gap-4 md:grid-cols-2">
                {reviews.slice(0, reviewsShown).map((r) => (
                  <motion.li key={r.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[22px] border bg-white p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.avatar} name={r.author} className="h-10 w-10" />
                      <div className="flex-1"><p className="font-semibold">{r.author}</p><p className="text-xs text-muted-foreground">{hydrated ? formatDate(r.date, locale) : ""}{r.serviceName && ` · ${tx(r.serviceName)}`}</p></div>
                      <Stars value={r.rating} />
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">{r.text}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" />{t("profile.verifiedBooking")}</p>
                  </motion.li>
                ))}
              </ul>
              {reviewsShown < reviews.length && <Button variant="outline" className="mt-5" onClick={() => setReviewsShown((n) => n + 6)}>{t("common.more")}</Button>}
            </section>

            <section id="availability" className="scroll-mt-32 pt-12">
              <h2 className="font-display text-2xl font-bold">{t("profile.availability")}</h2>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const h = p.availability[d];
                  return (
                    <div key={d} className={cn("rounded-[18px] border p-3 text-center", d === today ? "border-primary bg-accent" : "bg-white", !h && "opacity-60")}>
                      <p className={cn("text-xs font-semibold uppercase", d === today ? "text-primary" : "text-muted-foreground")}>{raw<string[]>("profile.weekdays")[d]}</p>
                      <p className="mt-2 text-[13px] font-semibold leading-tight">{h ? <>{h[0]}:00<br /><span className="text-muted-foreground">—</span><br />{h[1]}:00</> : <span className="text-xs">{t("profile.dayOff")}</span>}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="location" className="scroll-mt-32 pt-12">
              <h2 className="font-display text-2xl font-bold">{t("profile.location")}</h2>
              <p className="mt-2 text-muted-foreground">{t("profile.serviceArea", { district: p.district, city: tx(city?.name) })}</p>
              <div className="mt-5 h-[320px] overflow-hidden rounded-[24px] border shadow-soft"><MapView providers={[p]} center={p} single className="h-full w-full" /></div>
            </section>
          </div>

          {/* booking sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-[92px]">
              <Card className="p-6 shadow-lift">
                <p className="text-sm text-muted-foreground">{t("profile.from")}</p>
                <p className="font-display text-3xl font-bold">{price(p.priceFrom)} <span className="text-sm font-medium text-muted-foreground">{t(`units.${p.priceUnit}`)}</span></p>
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success-soft px-3 py-2.5 text-sm font-medium text-success"><span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative h-2 w-2 rounded-full bg-success" /></span>{t("card.respondsIn", { n: p.responseMinutes })}</div>
                <div className="mt-5 space-y-2.5">
                  <Button asChild size="lg" className="w-full"><Link href={bookHref}><CalendarCheck />{t("profile.book")}</Link></Button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button variant="outline" size="lg" onClick={message}><MessageCircle />{t("profile.message")}</Button>
                    {showPhone ? <Button asChild variant="outline" size="lg"><a href={`tel:${p.phone.replace(/\s/g, "")}`} className="!text-xs">{p.phone}</a></Button>
                      : <Button variant="outline" size="lg" onClick={() => setShowPhone(true)}><Phone />{t("profile.call")}</Button>}
                  </div>
                </div>
                <ul className="mt-6 space-y-3 border-t pt-5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5"><Lock className="h-4 w-4 text-success" />{t("profile.protected")}</li>
                  <li className="flex items-center gap-2.5"><CalendarDays className="h-4 w-4 text-success" />{t("profile.freeCancel")}</li>
                  <li className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-success" />{t("profile.verifiedTitle")}</li>
                </ul>
              </Card>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 font-display text-2xl font-bold">{t("seo.otherServices")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((s) => <ProviderCard key={s.id} p={s} />)}</div>
          </section>
        )}
      </div>

      {/* mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[64px] z-40 border-t bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="container flex items-center gap-3 px-1">
          <div className="flex-1"><p className="text-[11px] text-muted-foreground">{t("profile.from")}</p><p className="font-display font-bold">{price(p.priceFrom)}</p></div>
          <Button variant="outline" size="icon" onClick={message} aria-label={t("profile.message")}><MessageCircle /></Button>
          <Button asChild><Link href={bookHref}>{t("profile.book")}</Link></Button>
        </div>
      </div>

      <Lightbox items={p.portfolio.map((x) => ({ src: x.image, title: tx(x.title) }))} index={lightbox} onChange={setLightbox} />
    </div>
  );

}

function Lightbox({ items, index, onChange }: { items: { src: string; title: string }[]; index: number | null; onChange: (i: number | null) => void }) {
  return (
    <Dialog open={index !== null} onOpenChange={(o) => !o && onChange(null)}>
      <DialogContent className="max-w-4xl bg-ink p-3 text-white sm:max-w-4xl" title={index !== null ? items[index]?.title : ""}>
        <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[20px]">
          <AnimatePresence mode="wait">
            {index !== null && <motion.div key={index} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full w-full"><SmartImage src={items[index].src.replace("w=900", "w=1600")} alt={items[index].title} className="h-full w-full object-cover" /></motion.div>}
          </AnimatePresence>
          <button onClick={() => onChange(((index ?? 0) - 1 + items.length) % items.length)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink" aria-label="prev"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => onChange(((index ?? 0) + 1) % items.length)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink" aria-label="next"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {items.map((it, i) => <button key={i} onClick={() => onChange(i)} className={cn("h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition", i === index ? "ring-primary" : "ring-transparent opacity-60")}><SmartImage src={it.src} alt="" className="h-full w-full" /></button>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
