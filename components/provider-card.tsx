"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Flame, Heart, MapPin, Star, Trophy, Zap, CheckCircle2, ArrowUpRight, Briefcase } from "lucide-react";
import type { Badge as B, Provider } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";
import { getCity } from "@/lib/data/catalog";
import { useHydrated, useStore } from "@/lib/store";
import { Avatar, SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export const BADGE_META: Record<B, { icon: typeof Star; cls: string }> = {
  verified: { icon: CheckCircle2, cls: "bg-success-soft text-success" },
  popular: { icon: Flame, cls: "bg-orange-50 text-orange-600" },
  fast: { icon: Zap, cls: "bg-accent text-primary" },
  top: { icon: Trophy, cls: "bg-ink text-white" },
};

export function ProviderBadge({ b, className }: { b: B; className?: string }) {
  const { t } = useI18n();
  const m = BADGE_META[b];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", m.cls, className)}><m.icon className="h-3 w-3" />{t(`badge.${b}`)}</span>;
}

export function FavoriteButton({ id, className }: { id: string; className?: string }) {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const fav = useStore((s) => s.favorites.includes(id));
  const toggle = useStore((s) => s.toggleFavorite);
  const on = hydrated && fav;
  return (
    <motion.button whileTap={{ scale: 0.85 }} aria-pressed={on} aria-label={on ? t("card.saved") : t("card.save")}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); toast.success(on ? t("common.saved") : t("card.saved")); }}
      className={cn("grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-105", className)}>
      <Heart className={cn("h-[18px] w-[18px] transition", on ? "fill-rose-500 text-rose-500" : "text-ink")} />
    </motion.button>
  );
}

export function ProviderCard({ p, distanceKm, variant = "grid", highlight, onHover }: { p: Provider; distanceKm?: number; variant?: "grid" | "row"; highlight?: boolean; onHover?: (id: string | null) => void }) {
  const { t, tx, price } = useI18n();
  const city = getCity(p.citySlug);
  const featuredBadge = p.badges.includes("top") ? "top" : p.badges.includes("popular") ? "popular" : p.badges.includes("fast") ? "fast" : null;
  const href = `/provider/${p.id}`;

  if (variant === "row")
    return (
      <Link href={href} onMouseEnter={() => onHover?.(p.id)} onMouseLeave={() => onHover?.(null)}
        className={cn("group flex gap-4 rounded-[24px] border bg-white p-3 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-4", highlight && "border-primary/40 ring-4 ring-primary/10")}>
        <div className="relative h-[132px] w-[112px] shrink-0 overflow-hidden rounded-[18px] sm:h-[150px] sm:w-[150px]">
          <SmartImage src={p.portfolio[0]?.image} alt={tx(p.profession)} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <Avatar src={p.avatar} name={p.name} className="absolute bottom-2 left-2 h-10 w-10" ring />
          {p.featured && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary backdrop-blur">Featured</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-display text-[17px] font-semibold">{p.name}{p.verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 fill-success text-white" />}</p>
              <p className="truncate text-sm text-muted-foreground">{tx(p.profession)} · {tx(city?.name)}{distanceKm !== undefined && ` · ${t("search.away", { n: distanceKm.toFixed(1) })}`}</p>
            </div>
            <FavoriteButton id={p.id} className="shrink-0 border" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{p.rating.toFixed(2).replace(/0$/, "")}</span>
            <span className="text-muted-foreground">{p.reviewsCount} {t("card.reviews")}</span>
            <span className="text-muted-foreground">· {p.ordersCount} {t("card.orders")}</span>
          </div>
          <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">{p.badges.slice(0, 3).map((b) => <ProviderBadge key={b} b={b} />)}</div>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("common.from")}</p>
              <p className="font-display text-lg font-bold leading-tight">{price(p.priceFrom)} <span className="text-xs font-medium text-muted-foreground">{t(`units.${p.priceUnit}`)}</span></p>
            </div>
            <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex"><Zap className="h-3.5 w-3.5 text-primary" />{t("card.respondsIn", { n: p.responseMinutes })}</span>
          </div>
        </div>
      </Link>
    );

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="group h-full">
      <Link href={href} className="flex h-full flex-col overflow-hidden rounded-[26px] border border-border/70 bg-white shadow-soft transition-shadow duration-300 hover:shadow-lift">
        <div className="relative aspect-[4/3] overflow-hidden">
          <SmartImage src={p.portfolio[0]?.image} alt={tx(p.profession)} className="h-full w-full transition-transform [transition-duration:900ms] ease-out group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
          <div className="absolute left-3 top-3 flex gap-1.5">{featuredBadge && <ProviderBadge b={featuredBadge} className="shadow-soft" />}</div>
          <FavoriteButton id={p.id} className="absolute right-3 top-3" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="relative">
              <Avatar src={p.avatar} name={p.name} className="h-14 w-14 ring-[3px] ring-white" />
              {p.verified && <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-5 w-5 fill-success text-white" />}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold shadow-soft backdrop-blur"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{p.rating.toFixed(2).replace(/0$/, "")}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-lg font-semibold">{p.name}</h3>
            {p.verified && <span className="inline-flex items-center gap-0.5 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-bold text-success"><CheckCircle2 className="h-3 w-3" />{t("badge.verified")}</span>}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{tx(p.profession)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />{p.reviewsCount} {t("card.reviews")}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{p.ordersCount} {t("card.orders")}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{tx(city?.name)}</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" />~{p.responseMinutes} {t("common.min")}</span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed pt-4 mt-5">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("common.from")}</p>
              <p className="whitespace-nowrap font-display text-base font-bold leading-tight">{price(p.priceFrom)}</p>
            </div>
            <Button size="sm" variant="dark" className="group/btn h-9 px-3.5 text-[13px]" tabIndex={-1}>{t("card.viewProfile")}<ArrowUpRight className="transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" /></Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProviderCardSkeleton({ variant = "grid" }: { variant?: "grid" | "row" }) {
  if (variant === "row") return (
    <div className="flex gap-4 rounded-[24px] border bg-white p-4"><div className="skeleton h-[150px] w-[150px] rounded-[18px]" /><div className="flex-1 space-y-3 py-2"><div className="skeleton h-5 w-1/2" /><div className="skeleton h-4 w-2/3" /><div className="skeleton h-4 w-1/3" /><div className="skeleton mt-8 h-6 w-1/4" /></div></div>
  );
  return <div className="overflow-hidden rounded-[26px] border bg-white"><div className="skeleton aspect-[4/3] rounded-none" /><div className="space-y-3 p-5"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-10 w-full" /></div></div>;
}
