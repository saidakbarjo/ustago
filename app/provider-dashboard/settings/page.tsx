"use client";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, Switch } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "@/components/layout/navbar";
import { useStore } from "@/lib/store";

export default function ProviderSettings() {
  const { t } = useI18n();
  const { provider: p } = useMyProvider();
  const planPrices = useStore((s) => s.planPrices);
  const commission = useStore((s) => s.commission);
  const [s, setS] = useState({ online: true, instant: false, vacation: false });
  if (!p) return null;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("pdash.settings")} />
      <Card className="p-6">
        {([["online", t("pdash.acceptOnline")], ["instant", t("pdash.instantBooking")], ["vacation", t("pdash.vacation")]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center justify-between border-b py-4 last:border-0"><span className="text-sm font-medium">{l}</span><Switch checked={s[k]} onCheckedChange={(v) => setS({ ...s, [k]: v })} /></label>
        ))}
      </Card>
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex-1"><p className="text-sm text-muted-foreground">{t("pdash.currentPlan")}</p><p className="font-display text-2xl font-bold">{t(`plans.names.${p.plan}`)} · ${planPrices[p.plan]}<span className="text-sm font-medium text-muted-foreground">{t("plans.monthly")}</span></p><p className="text-sm text-muted-foreground">{t("pdash.commission")}: {commission[p.plan]}%</p></div>
        <Button asChild><Link href="/pricing">{t("pdash.upgrade")}</Link></Button>
      </Card>
      <Card className="flex items-center justify-between p-6"><p className="font-semibold">{t("dash.language")}</p><LangSwitcher /></Card>
    </div>
  );
}
