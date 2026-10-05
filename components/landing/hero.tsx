"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CalendarCheck, CheckCircle2, MapPin, ShieldCheck, Star, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { SearchBar } from "@/components/search-bar";
import { Avatar, SmartImage } from "@/components/ui/smart-image";
import { PROVIDERS, categoryImage } from "@/lib/data/providers";
import { SERVICE_TYPES } from "@/lib/data/catalog";
import { Counter, Tilt } from "@/components/motion";
import { cn } from "@/lib/utils";

const LIVE = [
  { name: "Ali", svc: "plumber", av: "men/22" }, { name: "Madina", svc: "cleaning", av: "women/44" }, { name: "Sardor", svc: "electrician", av: "men/41" },
  { name: "Olga", svc: "english-tutor", av: "women/65" }, { name: "Jasur", svc: "car-mechanic", av: "men/12" }, { name: "Kamila", svc: "makeup-artist", av: "women/33" },
];

function LiveToast({ className }: { className?: string }) {
  const { t, tx } = useI18n();
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % LIVE.length), 4200); return () => clearInterval(id); }, []);
  const l = LIVE[i];
  const svc = SERVICE_TYPES.find((s) => s.slug === l.svc)!;
  return (
    <div className={cn("h-[68px]", className)}>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.45 }}
          className="glass flex items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-4">
          <div className="relative"><Avatar src={`https://randomuser.me/api/portraits/${l.av}.jpg`} name={l.name} className="h-10 w-10" /><span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-success ring-2 ring-white"><CheckCircle2 className="h-3 w-3 text-white" /></span></div>
          <div className="text-sm leading-tight">
            <p className="font-semibold">{t("hero.liveBooked", { name: l.name, service: tx(svc.name).toLowerCase() })}</p>
            <p className="text-xs text-muted-foreground">{t("hero.justNow")} · Toshkent</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HeroVisual() {
  const { t, tx, price } = useI18n();
  const p = PROVIDERS[0];
  return (
    <div className="relative mx-auto h-[620px] w-full max-w-[560px]">
      {/* main card */}
      <div className="absolute left-1/2 top-[88px] w-[330px] -translate-x-1/2"><motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }}>
        <Tilt>
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_40px_80px_-30px_rgba(30,41,90,.45)]">
            <div className="relative h-[190px]">
              <SmartImage src={categoryImage("repair", 0, 700)} alt="" className="h-full w-full" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{t("badge.top")}</span>
              <div className="absolute -bottom-7 left-5"><Avatar src={p.avatar} name={p.name} className="h-16 w-16 ring-4 ring-white" /></div>
            </div>
            <div className="px-5 pb-5 pt-9">
              <p className="flex items-center gap-1.5 font-display text-lg font-semibold">{p.name}<BadgeCheck className="h-5 w-5 fill-success text-white" /></p>
              <p className="text-sm text-muted-foreground">{tx(p.profession)} · Yunusobod</p>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />4.9</span>
                <span className="text-muted-foreground">{p.reviewsCount} {t("card.reviews")}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Zap className="h-3.5 w-3.5 text-primary" />~8 {t("common.min")}</span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary/70 p-3">
                <div><p className="text-[11px] text-muted-foreground">{t("common.from")}</p><p className="font-display font-bold">{price(p.priceFrom)}</p></div>
                <Link href={`/provider/${p.id}`} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow">{t("profile.book")}</Link>
              </div>
            </div>
          </div>
        </Tilt>
      </motion.div></div>

      {/* verified chip */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="absolute left-[-16px] top-[0px]">
        <div className="glass flex animate-float items-center gap-3 rounded-2xl p-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-success-soft text-success"><ShieldCheck className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold">{t("hero.verifiedPro")}</p>
            <div className="mt-1 flex -space-x-2">{[45, 44, 22, 65].map((n, i) => <Avatar key={n} src={`https://randomuser.me/api/portraits/${i % 2 ? "women" : "men"}/${n}.jpg`} name="P" className="h-6 w-6" ring />)}<span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[9px] font-bold text-white ring-2 ring-white">+12k</span></div>
          </div>
        </div>
      </motion.div>

      {/* rating */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.75 }} className="absolute right-0 top-[10px]">
        <div className="glass animate-float-slow rounded-2xl px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold">4.9<span className="text-base text-muted-foreground">/5</span></p>
          <div className="flex gap-0.5">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("hero.statRating")}</p>
        </div>
      </motion.div>

      {/* map / location */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }} className="absolute right-[-44px] top-[150px]">
        <div className="glass w-[200px] animate-float overflow-hidden rounded-2xl p-2" style={{ animationDelay: "1.2s" }}>
          <div className="relative h-[96px] overflow-hidden rounded-xl bg-[#e9eef8]">
            <svg viewBox="0 0 200 96" className="absolute inset-0 h-full w-full">
              <path d="M0 60 Q50 40 100 55 T200 45" stroke="#fff" strokeWidth="9" fill="none" />
              <path d="M70 0 L85 96" stroke="#fff" strokeWidth="7" />
              <path d="M140 0 Q130 50 160 96" stroke="#fff" strokeWidth="5" />
              <path d="M30 70 Q80 30 128 46" stroke="#3a55ff" strokeWidth="3" fill="none" strokeDasharray="5 5" />
            </svg>
            <span className="absolute left-[24px] top-[62px] h-3 w-3 rounded-full bg-ink ring-4 ring-white" />
            <span className="absolute left-[122px] top-[38px] grid h-4 w-4 place-items-center"><span className="absolute h-4 w-4 animate-pulse-ring rounded-full bg-primary" /><span className="relative h-3.5 w-3.5 rounded-full bg-primary ring-[3px] ring-white" /></span>
          </div>
          <p className="flex items-center gap-1.5 px-1 pt-2 text-xs font-semibold"><MapPin className="h-3.5 w-3.5 text-primary" />{t("hero.arrives")}</p>
        </div>
      </motion.div>

      {/* booked card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }} className="absolute bottom-[34px] left-[-24px]">
        <div className="glass flex animate-float-slow items-center gap-3 rounded-2xl p-3 pr-5" style={{ animationDelay: "2s" }}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-glow"><CalendarCheck className="h-5 w-5" /></span>
          <div><p className="text-sm font-semibold">{t("how.demoBooked")}</p><p className="text-xs text-muted-foreground">USG-482915 · {t("dash.status.confirmed")}</p></div>
        </div>
      </motion.div>

      <div className="absolute bottom-[-18px] right-[-30px] w-[300px]"><LiveToast /></div>
    </div>
  );
}

export function Hero() {
  const { t } = useI18n();
  const words = t("hero.titleAccent");
  return (
    <section className="relative overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#eef2ff_0%,_#ffffff_60%)]" />
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] animate-float-slow rounded-full bg-brand-300/30 blur-[110px]" />
        <div className="absolute right-[-120px] top-[60px] h-[460px] w-[460px] animate-float rounded-full bg-violet-300/30 blur-[110px]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-200/40 blur-[110px]" />
      </div>

      <div className="container grid items-center gap-10 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.12fr_1fr] lg:gap-6 lg:pb-24 lg:pt-20">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow normal-case tracking-normal">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
            {t("hero.badge")}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.8 }}
            className="mt-6 font-display text-[40px] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink sm:text-6xl lg:text-[62px]">
            {t("hero.title")} <span className="text-gradient">{words}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.8 }} className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.8 }} className="mt-8 max-w-[680px]">
            <SearchBar />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{t("hero.popular")}</span>
            {["plumber", "electrician", "cleaning", "car-mechanic", "english-tutor"].map((s, i) => {
              const st = SERVICE_TYPES.find((x) => x.slug === s)!;
              return (
                <motion.div key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.07 }}>
                  <Link href={`/search?service=${s}&city=tashkent`} className="inline-flex rounded-full border bg-white/80 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-soft">
                    <PopularLabel slug={s} fallback={st.name.en} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t pt-6">
            <div><p className="font-display text-2xl font-bold sm:text-3xl"><Counter to={4.9} decimals={1} />★</p><p className="text-xs text-muted-foreground sm:text-sm">{t("hero.statRating")}</p></div>
            <div><p className="font-display text-2xl font-bold sm:text-3xl"><Counter to={38400} /></p><p className="text-xs text-muted-foreground sm:text-sm">{t("hero.statBookings")}</p></div>
            <div><p className="font-display text-2xl font-bold sm:text-3xl"><Counter to={12} /> {t("common.min")}</p><p className="text-xs text-muted-foreground sm:text-sm">{t("hero.statResponse")}</p></div>
          </motion.div>
          <div className="mt-6 lg:hidden"><LiveToast /></div>
        </div>
        <div className="hidden lg:block"><HeroVisual /></div>
      </div>
    </section>
  );
}

function PopularLabel({ slug, fallback }: { slug: string; fallback: string }) {
  const { tx } = useI18n();
  const st = SERVICE_TYPES.find((x) => x.slug === slug);
  return <>{st ? tx(st.name) : fallback}</>;
}
