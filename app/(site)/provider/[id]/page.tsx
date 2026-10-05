import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileClient } from "@/components/provider/profile-client";
import { PROVIDERS, getProvider } from "@/lib/data/providers";
import { getCity } from "@/lib/data/catalog";
import { getServerT } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return PROVIDERS.map((p) => ({ id: p.id }));
}
export const dynamicParams = false; // specialists approved at runtime are served by the client-side fallback in app/not-found.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = getProvider(id);
  const { tx, price, t } = await getServerT();
  if (!p) return { title: t("profile.notFound") };
  const title = `${p.name} — ${tx(p.profession)}, ${tx(getCity(p.citySlug)?.name)}`;
  const description = `${tx(p.profession)} · ★ ${p.rating} (${p.reviewsCount}) · ${t("common.from")} ${price(p.priceFrom)}. ${tx(p.about).slice(0, 110)}…`;
  return { title, description, alternates: { canonical: `/provider/${p.id}` }, openGraph: { title, description, images: [p.portfolio[0]?.image ?? ""], type: "profile" } };
}

export default async function ProviderPage({ params }: Props) {
  const { id } = await params;
  const p = getProvider(id);
  // providers approved at runtime (demo registrations) exist only client-side, so we don't 404 unknown ids in demo mode
  const { tx } = await getServerT();
  return (
    <>
      {p && (
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "LocalBusiness", "@id": `${SITE_URL}/provider/${p.id}`, name: p.name, image: p.avatar,
          description: tx(p.about), telephone: p.phone, priceRange: `${p.priceFrom}+ UZS`, url: `${SITE_URL}/provider/${p.id}`,
          address: { "@type": "PostalAddress", addressLocality: tx(getCity(p.citySlug)?.name), addressRegion: p.district, addressCountry: "UZ" },
          geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
          aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewsCount, bestRating: 5 },
          makesOffer: p.services.map((s) => ({ "@type": "Offer", name: tx(s.name), price: s.price, priceCurrency: "UZS" })),
        }} />
      )}
      <ProfileClient id={id} />
    </>
  );
}
