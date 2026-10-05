"use client";
import { notFound } from "next/navigation";
import * as S from "@/components/admin/admin-sections";

const MAP: Record<string, () => React.ReactElement> = {
  "": S.AdminOverview, users: S.AdminUsers, providers: S.AdminProviders, verification: S.AdminVerification, bookings: S.AdminBookings,
  payments: S.AdminPayments, reviews: S.AdminReviews, reports: S.AdminReports, categories: S.AdminCategories, services: S.AdminServices,
  cities: S.AdminCities, promotions: S.AdminPromotions, monetization: S.AdminMonetization,
};

export const ADMIN_SECTIONS = Object.keys(MAP);

export function AdminRouter({ section }: { section: string }) {
  const C = MAP[section];
  if (!C) notFound();
  return <C />;
}
