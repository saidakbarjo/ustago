"use client";
import { LayoutDashboard, CalendarCheck, MessageCircle, Heart, Star, CreditCard, Bell, Settings, Search } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useI18n } from "@/lib/i18n/provider";
import { useUnreadCounts, useStore, useHydrated } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const counts = useUnreadCounts("user");
  const hydrated = useHydrated();
  const upcoming = useStore((s) => s.bookings.filter((b) => b.userId === s.session?.userId && ["pending", "confirmed", "in_progress"].includes(b.status)).length);
  const items = [
    { href: "/dashboard", label: t("dash.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/dashboard/bookings", label: t("dash.bookings"), icon: CalendarCheck, badge: hydrated ? upcoming : 0 },
    { href: "/dashboard/messages", label: t("dash.messages"), icon: MessageCircle, badge: counts.messages },
    { href: "/dashboard/favorites", label: t("dash.favorites"), icon: Heart },
    { href: "/dashboard/reviews", label: t("dash.reviews"), icon: Star },
    { href: "/dashboard/payments", label: t("dash.payments"), icon: CreditCard },
    { href: "/dashboard/notifications", label: t("dash.notifications"), icon: Bell, badge: counts.notifications },
    { href: "/dashboard/settings", label: t("dash.settings"), icon: Settings },
  ];
  return (
    <DashboardShell role="customer" items={items} title={t("nav.dashboard")}
      footer={<div className="rounded-[20px] bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white"><p className="text-sm font-semibold">{t("cta.title")}</p><Button asChild size="sm" className="mt-3 w-full bg-white text-ink shadow-none hover:bg-white/90"><Link href="/search"><Search />{t("nav.find")}</Link></Button></div>}>
      {children}
    </DashboardShell>
  );
}
