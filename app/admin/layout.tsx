"use client";
import { LayoutDashboard, Users, Briefcase, Shapes, Wrench, CalendarCheck, CreditCard, Star, Flag, ShieldCheck, Megaphone, DollarSign, MapPin } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useI18n } from "@/lib/i18n/provider";
import { useHydrated, useStore } from "@/lib/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const pending = useStore((s) => s.applications.filter((a) => a.status === "under_review").length);
  const items = [
    { href: "/admin", label: t("admin.overview"), icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: t("admin.users"), icon: Users },
    { href: "/admin/providers", label: t("admin.providers"), icon: Briefcase },
    { href: "/admin/verification", label: t("admin.verification"), icon: ShieldCheck, badge: hydrated ? pending : 0 },
    { href: "/admin/bookings", label: t("admin.bookings"), icon: CalendarCheck },
    { href: "/admin/payments", label: t("admin.payments"), icon: CreditCard },
    { href: "/admin/reviews", label: t("admin.reviews"), icon: Star },
    { href: "/admin/reports", label: t("admin.reports"), icon: Flag, badge: 3 },
    { href: "/admin/categories", label: t("admin.categories"), icon: Shapes },
    { href: "/admin/services", label: t("admin.services"), icon: Wrench },
    { href: "/admin/cities", label: t("admin.cities"), icon: MapPin },
    { href: "/admin/promotions", label: t("admin.promotions"), icon: Megaphone },
    { href: "/admin/monetization", label: t("admin.monetization"), icon: DollarSign },
  ];
  return <DashboardShell role="admin" items={items} title={t("nav.admin")}>{children}</DashboardShell>;
}
