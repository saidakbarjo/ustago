import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { CATEGORIES, SERVICE_TYPES } from "@/lib/data/catalog";
import { CategoryIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("categories.pageTitle"), description: t("categories.pageSubtitle"), alternates: { canonical: "/categories" } };
}

import { CategoriesBody } from "@/components/seo-pages/CategoriesBody";

export default function CategoriesPage() {
  return <CategoriesBody />;
}
