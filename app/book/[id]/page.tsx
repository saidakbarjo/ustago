import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("booking.title"), robots: { index: false } };
}

import { PROVIDERS } from "@/lib/data/providers";

export function generateStaticParams() { return PROVIDERS.map((p) => ({ id: p.id })); }
export const dynamicParams = false;

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><BookingFlow id={id} /></Suspense>;
}
