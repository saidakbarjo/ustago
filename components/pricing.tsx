"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Star, Megaphone, Rocket } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DEFAULT_PLANS, PROMOTION_PRODUCTS } from "@/lib/data/catalog";
import { useHydrated, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/landing/sections";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export function Pricing() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const prices = useStore((s) => s.planPrices);
  const session = useStore((s) => s.session);
  const icons = { featured: Star, sponsored: Megaphone, promoted: Rocket };
  return (
    <div className="section">
      <div className="container">
        <SectionHeader center eyebrow={t("plans.eyebrow")} title={t("plans.title")} subtitle={t("plans.subtitle")} />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {DEFAULT_PLANS.map((p, i) => {
            const price = hydrated ? prices[p.id] : p.priceUsd;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={cn("relative flex flex-col rounded-[28px] border bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-lift", p.highlighted && "border-primary/40 bg-gradient-to-b from-accent to-white ring-4 ring-primary/10")}>
                {p.highlighted && <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-glow"><Sparkles className="h-3.5 w-3.5" />{t("plans.popular")}</span>}
                <p className="font-display text-xl font-bold">{t(`plans.names.${p.id}`)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(`plans.desc.${p.id}`)}</p>
                <p className="mt-6 font-display text-5xl font-bold tracking-tight">${price}<span className="text-base font-medium text-muted-foreground">{t("plans.monthly")}</span></p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => <li key={f} className="flex items-start gap-2.5"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-soft text-success"><Check className="h-3 w-3" strokeWidth={3} /></span>{t(`plans.f.${f.split(".").pop()}`)}</li>)}
                </ul>
                <Button className="mt-8 w-full" variant={p.highlighted ? "default" : "outline"} size="lg"
                  onClick={() => { if (!session) window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/signup/?role=provider`; else toast.success(`${t(`plans.names.${p.id}`)} · Click / Payme / Uzum / Stripe`); }}>
                  {t("plans.choose")}
                </Button>
              </motion.div>
            );
          })}
        </div>
        <div id="promotion" className="mt-20 scroll-mt-24">
          <h3 className="mb-6 font-display text-2xl font-bold">{t("plans.extras")}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {PROMOTION_PRODUCTS.map((pr) => {
              const I = icons[pr.id];
              return (
                <div key={pr.id} className="flex items-start gap-4 rounded-[24px] border bg-white p-6 shadow-soft">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-white"><I className="h-5 w-5" /></span>
                  <div className="flex-1"><p className="font-semibold">{t(`plans.extraNames.${pr.id}`)}</p><p className="mt-1 text-sm text-muted-foreground">{t(`plans.extraDesc.${pr.id}`)}</p><p className="mt-3 font-display text-xl font-bold">${pr.priceUsd} <span className="text-sm font-medium text-muted-foreground">/ {t("plans.days", { n: pr.days })}</span></p></div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t("pdash.commission")}: Free 15% · Pro 10% · Business 8% · Premium 5% — <Link href="/become-a-specialist" className="font-semibold text-primary">{t("nav.become")}</Link></p>
        </div>
      </div>
    </div>
  );
}
