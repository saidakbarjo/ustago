import type { Metadata } from "next";
import { Registration } from "@/components/become/registration";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("reg.title"), description: t("become.subtitle"), alternates: { canonical: "/become-a-specialist" } };
}
export default function BecomePage() { return <Registration />; }
