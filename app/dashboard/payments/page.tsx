"use client";
import { CreditCard, Wallet, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { getProviderById, useStore } from "@/lib/store";
import { PageHeader, StatCard, StatusPill } from "@/components/layout/dashboard-shell";
import { Card, EmptyState } from "@/components/ui/misc";

export default function PaymentsPage() {
  const { t, price, locale } = useI18n();
  const uid = useStore((s) => s.session?.userId);
  const allPayments = useStore((s) => s.payments);
  const payments = allPayments.filter((p) => p.userId === uid && p.kind === "booking");
  const spent = payments.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amount, 0);
  return (
    <div>
      <PageHeader title={t("dash.payments")} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label={t("dash.totalSpent")} value={price(spent)} tone="brand" />
        <StatCard icon={Receipt} label={t("admin.payments")} value={payments.length} tone="violet" />
        <StatCard icon={CreditCard} label={t("dash.paymentStatus.held")} value={price(payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0))} tone="warning" />
      </div>
      {payments.length === 0 ? <EmptyState icon={<CreditCard />} title={t("admin.noItems")} /> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-3 font-medium">ID</th><th className="px-5 py-3 font-medium">{t("booking.specialist")}</th><th className="px-5 py-3 font-medium">{t("common.date")}</th><th className="px-5 py-3 font-medium">{t("dash.method")}</th><th className="px-5 py-3 font-medium">{t("common.status")}</th><th className="px-5 py-3 text-right font-medium">{t("common.amount")}</th></tr></thead>
            <tbody>{payments.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/40">
                <td className="px-5 py-4 font-mono text-xs">{p.bookingId}</td><td className="px-5 py-4 font-medium">{getProviderById(p.providerId ?? "")?.name}</td>
                <td className="px-5 py-4 text-muted-foreground">{formatDate(p.at, locale)}</td><td className="px-5 py-4 capitalize">{t(`booking.methods.${p.method}`)}</td>
                <td className="px-5 py-4"><StatusPill status={p.status === "pending" ? "held" : p.status} /></td><td className="px-5 py-4 text-right font-semibold">{price(p.amount)}</td>
              </tr>))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
