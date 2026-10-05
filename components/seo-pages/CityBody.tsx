"use client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { CATEGORIES, CITIES, SERVICE_TYPES, getCity } from "@/lib/data/catalog";
import { PROVIDERS } from "@/lib/data/providers";
import { CITY_COUNTS } from "@/lib/search";
import { ProviderCard } from "@/components/provider-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { SearchBar } from "@/components/search-bar";
import { CategoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SITE_URL, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function CityBody({ slug }: { slug: string }) {
  const { t, tx, price } = useI18n();
  const c = getCity(slug);
  if (!c) return null;
  const providers = PROVIDERS.filter((p) => p.citySlug === slug).sort((a, b) => b.rating * Math.log(b.reviewsCount + 2) - a.rating * Math.log(a.reviewsCount + 2));
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: t("cities.cityTitle", { city: tx(c.name) }), url: `${SITE_URL}/city/${slug}`, about: { "@type": "City", name: tx(c.name), geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng } } }} />
      <section className="border-b bg-[radial-gradient(ellipse_at_top,#eef2ff,#fff_70%)]">
        <div className="container py-10 md:py-14">
          <Breadcrumbs items={[{ name: "USTAGO", href: "/" }, { name: t("nav.cities"), href: "/cities" }, { name: tx(c.name), href: `/city/${slug}` }]} />
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("cities.cityTitle", { city: tx(c.name) })}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("cities.citySubtitle", { city: tx(c.name) })}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" />{tx(c.region)} · {t("cities.specialists", { n: CITY_COUNTS[slug].toLocaleString("ru-RU").replace(/ /g, " ") })}</p>
          <SearchBar size="md" defaultCity={slug} className="mt-8 max-w-3xl" />
        </div>
      </section>
      <section className="container py-12">
        <h2 className="font-display text-2xl font-bold">{t("cities.popularIn", { city: tx(c.name) })}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/search?category=${cat.id}&city=${slug}`} className="group flex items-center gap-3 rounded-[20px] border bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white", cat.tone)}><CategoryIcon icon={cat.icon} className="h-[18px] w-[18px]" /></span>
              <span className="text-sm font-semibold">{tx(cat.name)}</span>
            </Link>
          ))}
        </div>
        <h2 className="mt-14 font-display text-2xl font-bold">{t("cities.topIn", { city: tx(c.name) })}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{providers.slice(0, 8).map((p) => <ProviderCard key={p.id} p={p} />)}</div>
        <div className="mt-8 text-center"><Button asChild size="lg" variant="outline"><Link href={`/search?city=${slug}`}>{t("top.viewAll")}<ArrowRight /></Link></Button></div>
        <div className="mt-14 flex flex-wrap gap-2">
          {SERVICE_TYPES.map((s) => <Link key={s.slug} href={`/search?service=${s.slug}&city=${slug}`} className="rounded-full border bg-white px-4 py-2 text-sm transition hover:border-primary/30 hover:text-primary">{tx(s.name)} — {tx(c.name)} · {t("services.startingAt", { price: price(s.fromPrice) })}</Link>)}
        </div>
        <div className="mt-10 flex flex-wrap gap-2 border-t pt-8"><span className="mr-2 text-sm font-semibold">{t("seo.otherCities")}:</span>{CITIES.filter((x) => x.slug !== slug).map((x) => <Link key={x.slug} href={`/city/${x.slug}`} className="text-sm text-primary hover:underline">{tx(x.name)}</Link>)}</div>
      </section>
    </>
  );
}
