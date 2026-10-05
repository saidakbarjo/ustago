import { AdminRouter } from "@/components/admin/admin-router";

const SECTIONS = ["", "users", "providers", "verification", "bookings", "payments", "reviews", "reports", "categories", "services", "cities", "promotions", "monetization"];

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s ? [s] : [] }));
}
export const dynamicParams = false;

export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  return <AdminRouter section={section?.[0] ?? ""} />;
}
