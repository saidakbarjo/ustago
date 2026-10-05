"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useProviders, useStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { ProviderCard } from "@/components/provider-card";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { t } = useI18n();
  const fav = useStore((s) => s.favorites);
  const list = useProviders().filter((p) => fav.includes(p.id));
  return (
    <div>
      <PageHeader title={t("dash.favorites")} subtitle={`${list.length}`} />
      {list.length === 0 ? <EmptyState icon={<Heart />} title={t("dash.emptyFavorites")} action={<Button asChild><Link href="/search">{t("dash.findPro")}</Link></Button>} />
        : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{list.map((p) => <ProviderCard key={p.id} p={p} />)}</div>}
    </div>
  );
}
