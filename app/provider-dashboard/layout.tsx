"use client";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, CalendarDays, MessageCircle, Wrench, Images, Star, Wallet, BarChart3, UserCircle, Settings, Rocket } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useI18n } from "@/lib/i18n/provider";
import { useUnreadCounts, useHydrated } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { Button } from "@/components/ui/button";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const counts = useUnreadCounts("provider");
  const hydrated = useHydrated();
  const { bookings, provider } = useMyProvider();
  const pending = hydrated ? bookings.filter((b) => b.status === "pending").length : 0;
  const items = [
    { href: "/provider-dashboard", label: t("pdash.overview"), icon: LayoutDashboard, exact: true },
    { href: "/provider-dashboard/orders", label: t("pdash.orders"), icon: ClipboardList, badge: pending },
    { href: "/provider-dashboard/calendar", label: t("pdash.calendar"), icon: CalendarDays },
    { href: "/provider-dashboard/messages", label: t("pdash.messages"), icon: MessageCircle, badge: counts.messages },
    { href: "/provider-dashboard/services", label: t("pdash.services"), icon: Wrench },
    { href: "/provider-dashboard/portfolio", label: t("pdash.portfolio"), icon: Images },
    { href: "/provider-dashboard/reviews", label: t("pdash.reviews"), icon: Star },
    { href: "/provider-dashboard/earnings", label: t("pdash.earnings"), icon: Wallet },
    { href: "/provider-dashboard/analytics", label: t("pdash.analytics"), icon: BarChart3 },
    { href: "/provider-dashboard/profile", label: t("pdash.profile"), icon: UserCircle },
    { href: "/provider-dashboard/settings", label: t("pdash.settings"), icon: Settings },
  ];
  return (
    <DashboardShell role="provider" items={items} title={t("nav.providerDashboard")}
      footer={<div className="rounded-[20px] bg-ink p-4 text-white"><p className="flex items-center gap-2 text-sm font-semibold"><Rocket className="h-4 w-4 text-brand-300" />{t("pdash.plan")}: <span className="uppercase text-brand-300">{provider?.plan ?? "free"}</span></p><p className="mt-1 text-xs text-white/60">{t("pdash.promoteText")}</p><Button asChild size="sm" className="mt-3 w-full"><Link href="/pricing">{t("pdash.upgrade")}</Link></Button></div>}>
      {children}
    </DashboardShell>
  );
}
