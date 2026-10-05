"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, SERVICE_TYPES } from "@/lib/data/catalog";
import { CategoryIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function CategoriesBody() {
  const { t, tx, price } = useI18n();
  return (
    <div className="container py-14">
      <span className="eyebrow">{t("categories.eyebrow")}</span>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("categories.pageTitle")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("categories.pageSubtitle")}</p>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((c) => (
          <section key={c.id} className="rounded-[26px] border bg-white p-6 shadow-soft transition hover:shadow-lift">
            <Link href={`/search?category=${c.id}`} className="group flex items-center gap-4">
              <span className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft", c.tone)}><CategoryIcon icon={c.icon} className="h-6 w-6" /></span>
              <div className="flex-1"><h2 className="font-display text-xl font-semibold group-hover:text-primary">{tx(c.name)}</h2><p className="text-sm text-muted-foreground">{tx(c.description)}</p></div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
            </Link>
            <ul className="mt-5 space-y-1 border-t pt-4">
              {SERVICE_TYPES.filter((s) => s.categoryId === c.id).map((s) => (
                <li key={s.slug}><Link href={`/services/${s.slug}`} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-secondary"><span className="font-medium">{tx(s.name)}</span><span className="text-muted-foreground">{t("services.startingAt", { price: price(s.fromPrice) })}</span></Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
