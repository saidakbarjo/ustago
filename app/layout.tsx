import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getServerLocale } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n";
import { SITE_URL } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = makeT(await getServerLocale());
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("seo.homeTitle"), template: "%s | USTAGO" },
    description: t("seo.homeDesc"),
    applicationName: "USTAGO",
    keywords: ["usta", "santexnik", "elektrik", "сантехник", "электрик", "мастер", "Ташкент", "Toshkent", "marketplace", "услуги"],
    openGraph: { type: "website", siteName: "USTAGO", title: t("seo.homeTitle"), description: t("seo.homeDesc"), url: SITE_URL, locale: "uz_UZ", alternateLocale: ["ru_RU", "en_US"] },
    twitter: { card: "summary_large_image", title: t("seo.homeTitle"), description: t("seo.homeDesc") },
    alternates: { canonical: "/" },
    icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg` },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} style={{ ["--font-sans" as string]: "'Inter Variable'", ["--font-display" as string]: "'Manrope Variable'" }}>
      <body className="min-h-screen">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
