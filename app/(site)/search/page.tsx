import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "@/components/search/search-client";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("search.title"), description: t("seo.homeDesc"), alternates: { canonical: "/search" }, robots: { index: false, follow: true } };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-10"><div className="skeleton h-14 w-full max-w-3xl rounded-full" /></div>}>
      <SearchClient />
    </Suspense>
  );
}
