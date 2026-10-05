import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { CITIES, SERVICE_TYPES, getCategory, getServiceType } from "@/lib/data/catalog";
import { PROVIDERS, categoryImage } from "@/lib/data/providers";
import { ProviderCard } from "@/components/provider-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { SearchBar } from "@/components/search-bar";
import { CategoryIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SITE_URL, cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return SERVICE_TYPES.map((s) => ({ slug: s.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getServiceType(slug);
  if (!s) return {};
  const { t, tx, price } = await getServerT();
  const title = t("seo.serviceTitle", { service: tx(s.name) });
  const description = t("seo.serviceDesc", { service: tx(s.name).toLowerCase(), price: price(s.fromPrice) });
  return { title: { absolute: title }, description, alternates: { canonical: `/services/${slug}` }, openGraph: { title, description, images: [categoryImage(s.categoryId, 1, 1200)] } };
}

import { ServiceBody } from "@/components/seo-pages/ServiceBody";

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  if (!getServiceType(slug)) notFound();
  return <ServiceBody slug={slug} />;
}
