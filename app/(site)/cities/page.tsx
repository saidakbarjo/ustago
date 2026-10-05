import type { Metadata } from "next";
import { getServerT } from "@/lib/i18n/server";
import { CitiesSection } from "@/components/landing/sections";
import { JsonLd } from "@/components/seo/json-ld";
import { CITIES } from "@/lib/data/catalog";
import { SITE_URL } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("cities.pageTitle"), description: t("cities.pageSubtitle"), alternates: { canonical: "/cities" } };
}

import { CitiesBody } from "@/components/seo-pages/CitiesBody";

export default function CitiesPage() {
  return <CitiesBody />;
}
