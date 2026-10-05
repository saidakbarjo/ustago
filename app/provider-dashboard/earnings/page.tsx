"use client";
import { Wallet, TrendingUp, Percent, Banknote, ArrowDownToLine } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader, StatCard, StatusPill } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Bars } from "@/components/charts";
import { monthlySeries } from "@/lib/analytics";
import { toast } from "@/components/ui/toast";

export default function EarningsPage() {
  const { t, price, locale, tx } = useI18n();
  const { provider: p, bookings } = useMyProvider();
  const commissions = useStore((s) => s.commission);
  if (!p) return null;
  const pct = commissions[p.plan];
  const monthly = monthlySeries(bookings, locale, { base: p.plan === "free" ? 2_400_000 : 6_800_000, growth: 0.07, seed: 2 }).map((m) => ({ ...m, net: Math.round(m.earnings * (1 - pct / 100)), fee: Math.round(m.earnings * (pct / 100)) }));
  const cur = monthly[11];
  const completed = bookings.filter((b) => b.status === "completed").sort((a, b) => b.date.localeCompare(a.date));
  const balance = Math.round(completed.slice(0, 4).reduce((s, b) => s + b.price, 0) * (1 - pct / 100));
  return (
    <div>
      <PageHeader title={t("pdash.earnings")} action={<Button onClick={() => toast.success(t("pdash.payoutNote"))}><ArrowDownToLine />{t("pdash.withdraw")}</Button>} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Wallet} label={t("pdash.balance")} value={price(balance)} tone="dark" />
        <StatCard icon={TrendingUp} label={`${t("pdash.gross")} · ${monthly[11].label}`} value={price(cur.earnings)} tone="brand" />
        <StatCard icon={Percent} label={`${t("pdash.commission")} (${pct}%)`} value={price(cur.fee)} tone="warning" />
        <StatCard icon={Banknote} label={t("pdash.netEarnings")} value={price(cur.net)} tone="success" />
      </div>
      <Card className="mt-6 p-6">
        <p className="mb-4 font-display text-lg font-semibold">{t("pdash.earningsChart")}</p>
        <Bars data={monthly} keys={[{ key: "net", name: t("pdash.netEarnings") }, { key: "fee", name: t("pdash.commission"), color: "#c7d2fe" }]} stacked height={300} fmt={(v) => price(v)} />
      </Card>
      <Card className="mt-6 overflow-x-auto p-0">
        <p className="border-b px-6 py-4 font-display text-lg font-semibold">{t("pdash.payouts")}</p>
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="px-6 py-3 font-medium">ID</th><th className="px-6 py-3 font-medium">{t("pdash.service")}</th><th className="px-6 py-3 font-medium">{t("common.date")}</th><th className="px-6 py-3 font-medium">{t("common.status")}</th><th className="px-6 py-3 text-right font-medium">{t("pdash.gross")}</th><th className="px-6 py-3 text-right font-medium">{t("pdash.netEarnings")}</th></tr></thead>
          <tbody>{completed.slice(0, 12).map((b) => (
            <tr key={b.id} className="border-b last:border-0 hover:bg-secondary/40">
              <td className="px-6 py-3.5 font-mono text-xs">{b.id}</td><td className="px-6 py-3.5">{tx(p.services.find((s) => s.id === b.serviceId)?.name)}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{formatDate(b.date, locale)}</td><td className="px-6 py-3.5"><StatusPill status={b.paymentStatus} /></td>
              <td className="px-6 py-3.5 text-right">{price(b.price)}</td><td className="px-6 py-3.5 text-right font-semibold">{price(Math.round(b.price * (1 - pct / 100)))}</td>
            </tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}
