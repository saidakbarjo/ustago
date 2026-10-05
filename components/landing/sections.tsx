"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, CheckCircle2, Clock, CreditCard, Headphones, Lock, MessageSquareQuote,
  Minus, Plus, Quote, Search, ShieldCheck, Sparkles, Star, Umbrella, Users, Wallet, Zap, TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { CATEGORIES, CITIES, SERVICE_TYPES, getCategory } from "@/lib/data/catalog";
import { PROVIDERS, categoryImage } from "@/lib/data/providers";
import { CITY_COUNTS, countByCategory } from "@/lib/search";
import { useProviders, useStore, useHydrated } from "@/lib/store";
import { CategoryIcon } from "@/components/icons";
import { ProviderCard } from "@/components/provider-card";
import { Avatar, SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Counter, Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

export function SectionHeader({ eyebrow, title, subtitle, center, action }: { eyebrow: string; title: string; subtitle?: string; center?: boolean; action?: React.ReactNode }) {
  return (
    <div className={cn("mb-12 flex flex-col gap-6 md:mb-14", center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <Reveal className={cn("max-w-2xl", center && "mx-auto")}>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] text-ink sm:text-[44px] sm:leading-[1.08]">{title}</h2>
        {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
      </Reveal>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  );
}

/* ---------------- Categories ---------------- */
export function Categories() {
  const { t, tx } = useI18n();
  const providers = useProviders();
  const inactive = useStore((s) => s.inactiveCategories);
  const hydrated = useHydrated();
  const counts = countByCategory(providers);
  const cats = CATEGORIES.filter((c) => !hydrated || !inactive.includes(c.id));
  return (
    <section id="categories" className="section">
      <div className="container">
        <SectionHeader eyebrow={t("categories.eyebrow")} title={t("categories.title")} subtitle={t("categories.subtitle")}
          action={<Button asChild variant="outline"><Link href="/categories">{t("categories.all")}<ArrowRight /></Link></Button>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
          {cats.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.035}>
              <Link href={`/search?category=${c.id}`} className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-border/70 bg-white p-5 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:border-transparent hover:shadow-lift">
                <div className={cn("absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25", c.tone)} />
                <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", c.tone)}>
                  <CategoryIcon icon={c.icon} className="h-[22px] w-[22px]" />
                </span>
                <p className="mt-6 font-display text-[17px] font-semibold">{tx(c.name)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("categories.specialists", { n: counts[c.id].toLocaleString("ru-RU").replace(/ /g, " ") })}</p>
                <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function StepVisual({ step }: { step: number }) {
  const { t } = useI18n();
  if (step === 0)
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-primary" />
          <motion.span initial={{ width: 0 }} whileInView={{ width: "auto" }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.3, ease: "linear" }} className="overflow-hidden whitespace-nowrap text-sm font-medium">{t("how.demoQuery")}</motion.span>
          <span className="h-4 w-[2px] animate-pulse bg-primary" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["plumber", "appliance-repair", "handyman"].map((s, i) => (
            <motion.span key={s} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1.6 + i * 0.12 }}
              className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", i === 0 ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
              <ServiceName slug={s} />
            </motion.span>
          ))}
        </div>
      </div>
    );
  if (step === 1)
    return (
      <div className="space-y-2">
        {PROVIDERS.filter((p) => p.categoryId === "repair").slice(0, 3).map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
            className={cn("flex items-center gap-2.5 rounded-2xl border bg-white p-2 shadow-sm", i === 0 && "border-primary/40 ring-4 ring-primary/10")}>
            <Avatar src={p.avatar} name={p.name} className="h-8 w-8" />
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{p.name}</p><p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}</p></div>
            <span className="text-xs font-bold">{(p.priceFrom / 1000).toFixed(0)}K</span>
          </motion.div>
        ))}
      </div>
    );
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.03 }}
            className={cn("grid h-7 place-items-center rounded-lg text-xs font-medium", i === 9 ? "bg-primary text-white shadow-glow" : i % 7 === 6 ? "text-muted-foreground/50" : "bg-secondary text-foreground")}>{i + 8}</motion.span>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1, type: "spring" }}
        className="mt-2.5 flex items-center gap-2 rounded-xl bg-success-soft px-2.5 py-2 text-xs font-semibold text-success"><CheckCircle2 className="h-4 w-4" />{t("how.demoBooked")}</motion.div>
    </div>
  );
}
function ServiceName({ slug }: { slug: string }) { const { tx } = useI18n(); return <>{tx(SERVICE_TYPES.find((s) => s.slug === slug)?.name)}</>; }

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [{ n: "01", title: t("how.s1t"), d: t("how.s1d") }, { n: "02", title: t("how.s2t"), d: t("how.s2d") }, { n: "03", title: t("how.s3t"), d: t("how.s3d") }];
  return (
    <section id="how-it-works" className="section relative overflow-hidden bg-[linear-gradient(180deg,#f6f8ff_0%,#ffffff_100%)]">
      <div className="container">
        <SectionHeader center eyebrow={t("how.eyebrow")} title={t("how.title")} subtitle={t("how.subtitle")} />
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* connector */}
          <svg className="pointer-events-none absolute left-0 right-0 top-[76px] hidden h-10 w-full md:block" preserveAspectRatio="none" viewBox="0 0 1000 40">
            <motion.path d="M160 20 C 330 -10, 430 50, 500 20 S 700 -10, 840 20" fill="none" stroke="url(#hg)" strokeWidth="2.5" strokeDasharray="6 8"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: "easeInOut" }} />
            <defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stopColor="#3a55ff" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
          </svg>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.15}>
              <div className="relative h-full rounded-[28px] border border-border/70 bg-white p-6 shadow-soft transition duration-300 hover:shadow-lift sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink font-display text-lg font-bold text-white shadow-lift">{s.n}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.d}</p>
                <div className="mt-6 rounded-[20px] bg-secondary/60 p-3"><StepVisual step={i} /></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Top specialists ---------------- */
export function TopSpecialists() {
  const { t } = useI18n();
  const providers = useProviders();
  const promoted = useStore((s) => s.promotedIds);
  const top = [...providers].filter((p) => p.citySlug === "tashkent").sort((a, b) => (promoted.includes(b.id) ? 1 : 0) - (promoted.includes(a.id) ? 1 : 0) || b.rating * Math.log(b.reviewsCount) - a.rating * Math.log(a.reviewsCount)).slice(0, 8);
  return (
    <section className="section">
      <div className="container">
        <SectionHeader eyebrow={t("top.eyebrow")} title={t("top.title")} subtitle={t("top.subtitle")}
          action={<Button asChild variant="outline"><Link href="/search?city=tashkent&sort=rating">{t("top.viewAll")}<ArrowRight /></Link></Button>} />
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 sm:gap-5">
          {top.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.06} className="w-[82%] shrink-0 snap-start sm:w-auto"><ProviderCard p={p} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Popular services ---------------- */
export function PopularServices() {
  const { t, tx, price } = useI18n();
  const list = ["plumber", "cleaning", "electrician", "ac-repair", "english-tutor", "car-diagnostics", "furniture-assembly", "photographer"].map((s) => SERVICE_TYPES.find((x) => x.slug === s)!);
  return (
    <section className="section pt-0">
      <div className="container">
        <SectionHeader eyebrow={t("services.eyebrow")} title={t("services.title")} subtitle={t("services.subtitle")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((s, i) => {
            const cat = getCategory(s.categoryId)!;
            return (
              <Reveal key={s.slug} delay={(i % 4) * 0.06}>
                <Link href={`/services/${s.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[26px] shadow-soft sm:aspect-[3/4]">
                  <SmartImage src={categoryImage(s.categoryId, i % 3 === 0 ? 1 : 2, 700)} alt={tx(s.name)} className="h-full w-full transition-transform [transition-duration:1000ms] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                  <span className={cn("absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-white/90 backdrop-blur")}><CategoryIcon icon={cat.icon} className="h-[18px] w-[18px] text-ink" /></span>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="font-display text-xl font-semibold">{tx(s.name)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-white/80">{t("services.startingAt", { price: price(s.fromPrice) })}</span>
                      <span className="grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why USTAGO ---------------- */
export function WhyUs() {
  const { t, raw } = useI18n();
  const items = raw<{ t: string; d: string }[]>("why.items");
  const icons = [BadgeCheck, Wallet, Zap, Lock, MessageSquareQuote, Headphones];
  return (
    <section id="why" className="section bg-ink text-white">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">{t("why.eyebrow")}</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.08]">{t("why.title")}</h2>
            <p className="mt-4 text-lg text-white/60">{t("why.subtitle")}</p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5"><p className="font-display text-4xl font-bold"><Counter to={98} suffix="%" /></p><p className="mt-1 text-sm text-white/60">{t("trust.stat2")}</p></div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5"><p className="font-display text-4xl font-bold"><Counter to={12} /> <span className="text-xl">{t("common.min")}</span></p><p className="mt-1 text-sm text-white/60">{t("hero.statResponse")}</p></div>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((it, i) => {
              const I = icons[i];
              return (
                <Reveal key={it.t} delay={i * 0.06}>
                  <div className="group h-full rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 transition duration-300 hover:border-white/20 hover:from-white/[0.1]">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/20 text-brand-300 transition group-hover:bg-primary group-hover:text-white"><I className="h-5 w-5" /></span>
                    <p className="mt-5 font-display text-lg font-semibold">{it.t}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{it.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust & Safety ---------------- */
export function TrustSafety() {
  const { t, raw } = useI18n();
  const items = raw<{ t: string; d: string }[]>("trust.items");
  const icons = [BadgeCheck, MessageSquareQuote, CreditCard, Umbrella, Headphones];
  return (
    <section id="trust" className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-[32px] border bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_45%,#eef2ff_100%)] p-6 sm:p-10 lg:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-success/10 blur-3xl" />
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <span className="eyebrow text-success"><ShieldCheck className="h-3.5 w-3.5" />{t("trust.eyebrow")}</span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] text-ink sm:text-[44px] sm:leading-[1.08]">{t("trust.title")}</h2>
              <p className="mt-4 max-w-lg text-lg text-muted-foreground">{t("trust.subtitle")}</p>
              <div className="relative mt-10 flex items-center justify-center lg:justify-start">
                <div className="relative grid h-44 w-44 place-items-center">
                  <span className="absolute inset-0 animate-[spin_24s_linear_infinite] rounded-full border-2 border-dashed border-success/30" />
                  <span className="absolute inset-5 rounded-full bg-success/10" />
                  <motion.span initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 120, damping: 12 }}
                    className="relative grid h-24 w-24 place-items-center rounded-[28px] bg-success text-white shadow-[0_20px_50px_-15px_rgba(22,163,74,.6)]"><ShieldCheck className="h-11 w-11" /></motion.span>
                </div>
                <div className="ml-6 space-y-3">
                  <div><p className="font-display text-3xl font-bold"><Counter to={100} suffix="%" /></p><p className="text-sm text-muted-foreground">{t("trust.stat1")}</p></div>
                  <div><p className="font-display text-3xl font-bold">&lt;<Counter to={5} /> {t("common.min")}</p><p className="text-sm text-muted-foreground">{t("trust.stat3")}</p></div>
                </div>
              </div>
            </Reveal>
            <div className="space-y-3">
              {items.map((it, i) => {
                const I = icons[i];
                return (
                  <Reveal key={it.t} delay={i * 0.07}>
                    <div className="flex items-start gap-4 rounded-[22px] border bg-white/80 p-4 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success-soft text-success"><I className="h-5 w-5" /></span>
                      <div className="flex-1"><p className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4 text-success" strokeWidth={3} />{it.t}</p><p className="mt-0.5 text-sm text-muted-foreground">{it.d}</p></div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Cities ---------------- */
export function CitiesSection({ full }: { full?: boolean }) {
  const { t, tx } = useI18n();
  const cities = full ? CITIES : CITIES.slice(0, 10);
  const cityImg = ["1565967511849-76a60a516170", "1596484552834-6a58f850e0a1", "1590079019458-0eb5b40a3371", "1528127269322-539801943592"];
  return (
    <section className={cn("section", !full && "pt-0")}>
      <div className="container">
        {!full && <SectionHeader eyebrow={t("cities.eyebrow")} title={t("cities.title")} subtitle={t("cities.subtitle")} action={<Button asChild variant="outline"><Link href="/cities">{t("nav.cities")}<ArrowRight /></Link></Button>} />}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {cities.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 5) * 0.05} >
              <Link href={`/city/${c.slug}`} className={cn("group relative flex h-full min-h-[150px] flex-col justify-end overflow-hidden rounded-[24px] border bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift", i === 0 && "text-white")}>
                {i === 0 ? (
                  <>
                    <SmartImage src={`https://images.unsplash.com/photo-${cityImg[0]}?auto=format&fit=crop&w=900&q=70`} alt={tx(c.name)} className="absolute inset-0 h-full w-full transition-transform [transition-duration:1000ms] group-hover:scale-105" tone="from-brand-600 via-indigo-600 to-violet-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                  </>
                ) : <div className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-secondary transition group-hover:bg-primary group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></div>}
                <div className="relative">
                  <p className="font-display text-lg font-semibold">{tx(c.name)}</p>
                  <p className={cn("text-sm", i === 0 ? "text-white/80" : "text-muted-foreground")}>{t("cities.specialists", { n: CITY_COUNTS[c.slug].toLocaleString("ru-RU").replace(/ /g, " ") })}</p>
                  {full && <p className={cn("mt-1 text-xs", i === 0 ? "text-white/60" : "text-muted-foreground")}>{tx(c.region)}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Become a specialist ---------------- */
export function BecomeSpecialist() {
  const { t } = useI18n();
  return (
    <section className="section pt-0">
      <div className="container">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 p-6 text-white sm:p-10 lg:p-14">
          <div className="grid-bg absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.2)_1px,transparent_1px)]" />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"><Sparkles className="h-3.5 w-3.5" />{t("become.eyebrow")}</span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.08]">{t("become.title")}</h2>
              <p className="mt-4 max-w-lg text-lg text-white/75">{t("become.subtitle")}</p>
              <ul className="mt-6 space-y-3">
                {[t("become.b1"), t("become.b2"), t("become.b3")].map((b) => <li key={b} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/20"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{b}</li>)}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-ink shadow-none hover:bg-white/90"><Link href="/become-a-specialist">{t("become.cta")}<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10"><Link href="/pricing">{t("become.secondary")}</Link></Button>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative mx-auto max-w-md">
                <div className="rounded-[26px] bg-white p-5 text-ink shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">{t("pdash.monthly")}</p><p className="font-display text-3xl font-bold"><Counter to={14850000} /> <span className="text-base font-semibold text-muted-foreground">{t("common.sum")}</span></p></div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success"><TrendingUp className="h-3.5 w-3.5" />+32%</span>
                  </div>
                  <div className="mt-5 flex h-28 items-end gap-2">
                    {[38, 52, 44, 60, 58, 72, 66, 84, 78, 92, 88, 100].map((h, i) => (
                      <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                        className={cn("flex-1 rounded-md", i === 11 ? "bg-primary" : "bg-brand-100")} />
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
                    <div><p className="font-display text-xl font-bold">+46</p><p className="text-[11px] text-muted-foreground">{t("become.newClients")}</p></div>
                    <div><p className="font-display text-xl font-bold">4.9★</p><p className="text-[11px] text-muted-foreground">{t("pdash.rating")}</p></div>
                    <div><p className="font-display text-xl font-bold">98%</p><p className="text-[11px] text-muted-foreground">{t("pdash.conversion")}</p></div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-ink shadow-2xl sm:-left-10">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-success text-white"><Users className="h-5 w-5" /></span>
                  <div><p className="text-sm font-semibold">{t("notif.new_request", { name: "Madina A." })}</p><p className="text-xs text-muted-foreground">{t("hero.justNow")}</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
export function Testimonials() {
  const { t, raw } = useI18n();
  const items = raw<{ text: string; name: string; role: string }[]>("testimonials.items");
  const avatars = ["women/44", "men/45", "women/68"];
  return (
    <section className="section pt-0">
      <div className="container">
        <SectionHeader center eyebrow={t("testimonials.eyebrow")} title={t("testimonials.title")} />
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.name} delay={i * 0.1}>
              <figure className={cn("flex h-full flex-col rounded-[26px] border p-7 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift", i === 1 ? "bg-ink text-white" : "bg-white")}>
                <Quote className={cn("h-8 w-8", i === 1 ? "text-brand-400" : "text-primary/30")} />
                <div className="mt-4 flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                <blockquote className={cn("mt-4 flex-1 text-[17px] leading-relaxed", i === 1 ? "text-white/90" : "text-foreground")}>“{it.text}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Avatar src={`https://randomuser.me/api/portraits/${avatars[i]}.jpg`} name={it.name} className="h-11 w-11" />
                  <div><p className="font-semibold">{it.name}</p><p className={cn("text-sm", i === 1 ? "text-white/60" : "text-muted-foreground")}>{it.role}</p></div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
export function FAQ() {
  const { t, raw } = useI18n();
  const items = raw<{ q: string; a: string }[]>("faq.items");
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section pt-0">
      <div className="container grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div><SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.title")} /></div>
        <div className="space-y-3">
          {items.map((it, i) => (
            <Reveal key={it.q} delay={i * 0.04}>
              <div className={cn("overflow-hidden rounded-[22px] border bg-white transition-shadow", open === i && "shadow-soft")}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold sm:p-6" aria-expanded={open === i}>
                  {it.q}
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border transition", open === i && "rotate-180 border-primary bg-primary text-white")}>{open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}>
                      <p className="px-5 pb-6 text-[15px] leading-relaxed text-muted-foreground sm:px-6">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
export function FinalCTA() {
  const { t } = useI18n();
  return (
    <section className="section pt-0">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 blur-[120px]" />
            <div className="absolute -bottom-20 right-10 h-60 w-60 rounded-full bg-violet-500/30 blur-[90px]" />
            <div className="relative">
              <div className="mx-auto mb-6 flex w-fit -space-x-3">{PROVIDERS.slice(0, 6).map((p) => <Avatar key={p.id} src={p.avatar} name={p.name} className="h-11 w-11 ring-[3px] ring-ink" />)}</div>
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">{t("cta.title")}</h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-white/65">{t("cta.subtitle")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="xl"><Link href="/search">{t("cta.primary")}<ArrowRight /></Link></Button>
                <Button asChild size="xl" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10"><Link href="/become-a-specialist">{t("cta.secondary")}</Link></Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{t("badge.verified")}</span>
                <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-emerald-400" />{t("profile.protected")}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-emerald-400" />{t("profile.freeCancel")}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-emerald-400" />24/7</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
