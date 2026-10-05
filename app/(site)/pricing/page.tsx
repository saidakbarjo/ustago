import type { Metadata } from "next";
import { Pricing } from "@/components/pricing";
import { getServerT } from "@/lib/i18n/server";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("plans.title"), description: t("plans.subtitle"), alternates: { canonical: "/pricing" } };
}
export default function PricingPage() { return <Pricing />; }
