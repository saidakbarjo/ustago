"use client";
import { CitiesSection } from "@/components/landing/sections";
import { JsonLd } from "@/components/seo/json-ld";
import { CITIES } from "@/lib/data/catalog";
import { SITE_URL } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function CitiesBody() {
  const { t, tx } = useI18n();
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: CITIES.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: tx(c.name), url: `${SITE_URL}/city/${c.slug}` })) }} />
      <div className="container pt-14">
        <span className="eyebrow">{t("cities.eyebrow")}</span>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("cities.pageTitle")}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("cities.pageSubtitle")}</p>
      </div>
      <CitiesSection full />
    </>
  );
}
