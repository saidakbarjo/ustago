"use client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { CITIES, SERVICE_TYPES, getCategory, getServiceType } from "@/lib/data/catalog";
import { PROVIDERS, categoryImage } from "@/lib/data/providers";
import { ProviderCard } from "@/components/provider-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { SearchBar } from "@/components/search-bar";
import { CategoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SITE_URL, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function ServiceBody({ slug }: { slug: string }) {
  const { t, tx, price, raw } = useI18n();
  const s = getServiceType(slug);
  if (!s) return null;
  const cat = getCategory(s.categoryId)!;
  const providers = PROVIDERS.filter((p) => p.serviceSlugs.includes(slug)).sort((a, b) => b.rating * Math.log(b.reviewsCount + 2) - a.rating * Math.log(a.reviewsCount + 2));
  const related = SERVICE_TYPES.filter((x) => x.slug !== slug && x.categoryId === s.categoryId).concat(SERVICE_TYPES.filter((x) => x.categoryId !== s.categoryId).slice(0, 4));
  const avg = providers.length ? (providers.reduce((a, p) => a + p.rating, 0) / providers.length).toFixed(1) : "4.9";
  const faq = [{ q: t("seo.priceQ", { service: tx(s.name).toLowerCase() }), a: t("seo.priceA", { price: price(s.fromPrice) }) }, ...raw<{ q: string; a: string }[]>("faq.items").slice(0, 3)];
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Service", name: tx(s.name), serviceType: tx(s.name), areaServed: { "@type": "Country", name: "Uzbekistan" }, provider: { "@type": "Organization", name: "USTAGO", url: SITE_URL },
          offers: { "@type": "AggregateOffer", lowPrice: s.fromPrice, priceCurrency: "UZS", offerCount: providers.length }, aggregateRating: { "@type": "AggregateRating", ratingValue: avg, reviewCount: providers.reduce((a, p) => a + p.reviewsCount, 0) || 120 } },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />
      <section className="border-b bg-[radial-gradient(ellipse_at_top,#eef2ff,#fff_70%)]">
        <div className="container py-10 md:py-14">
          <Breadcrumbs items={[{ name: "USTAGO", href: "/" }, { name: tx(cat.name), href: `/search?category=${cat.id}` }, { name: tx(s.name), href: `/services/${slug}` }]} />
          <div className="mt-6 flex items-center gap-4">
            <span className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft", cat.tone)}><CategoryIcon icon={cat.icon} className="h-6 w-6" /></span>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("seo.serviceH1", { service: tx(s.name) })}</h1>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-lg text-muted-foreground">
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-5 w-5 text-success" />{t("seo.serviceSub", { n: providers.length, price: price(s.fromPrice) })}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-5 w-5 fill-amber-400 text-amber-400" />{avg}</span>
          </p>
          <SearchBar size="md" defaultQuery={tx(s.name)} className="mt-8 max-w-3xl" />
        </div>
      </section>
      <section className="container py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{providers.slice(0, 12).map((p) => <ProviderCard key={p.id} p={p} />)}</div>
        <div className="mt-8 text-center"><Button asChild size="lg" variant="outline"><Link href={`/search?service=${slug}`}>{t("top.viewAll")}<ArrowRight /></Link></Button></div>
      </section>
      <section className="container grid gap-10 pb-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold">{t("seo.faqTitle", { service: tx(s.name).toLowerCase() })}</h2>
          <dl className="mt-5 space-y-3">{faq.map((f) => <div key={f.q} className="rounded-[20px] border bg-white p-5"><dt className="font-semibold">{f.q}</dt><dd className="mt-2 text-sm text-muted-foreground">{f.a}</dd></div>)}</dl>
        </div>
        <div className="space-y-8">
          <div><h2 className="font-display text-2xl font-bold">{t("seo.otherServices")}</h2><div className="mt-5 flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={`/services/${r.slug}`} className="rounded-full border bg-white px-4 py-2 text-sm font-medium transition hover:border-primary/30 hover:text-primary">{tx(r.name)}</Link>)}</div></div>
          <div><h2 className="font-display text-2xl font-bold">{t("nav.cities")}</h2><div className="mt-5 flex flex-wrap gap-2">{CITIES.map((c) => <Link key={c.slug} href={`/city/${c.slug}`} className="rounded-full border bg-white px-4 py-2 text-sm font-medium transition hover:border-primary/30 hover:text-primary">{tx(s.name)} · {tx(c.name)}</Link>)}</div></div>
        </div>
      </section>
    </>
  );
}
