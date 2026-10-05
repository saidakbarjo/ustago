import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
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

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return CITIES.map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCity(slug);
  if (!c) return {};
  const { t, tx } = await getServerT();
  const title = t("seo.cityTitle", { city: tx(c.name) });
  return { title: { absolute: title }, description: t("seo.cityDesc", { city: tx(c.name) }), alternates: { canonical: `/city/${slug}` } };
}

import { CityBody } from "@/components/seo-pages/CityBody";

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  if (!getCity(slug)) notFound();
  return <CityBody slug={slug} />;
}
