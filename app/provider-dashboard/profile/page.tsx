"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Eye, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { getCity, getCategory } from "@/lib/data/catalog";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, Checkbox } from "@/components/ui/misc";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/smart-image";
import { ProviderBadge } from "@/components/provider-card";
import type { Locale, WeeklyAvailability } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export default function ProviderProfileEdit() {
  const { t, tx, locale, raw } = useI18n();
  const { provider: p, pid } = useMyProvider();
  const update = useStore((s) => s.updateProvider);
  const [about, setAbout] = useState("");
  const [langs, setLangs] = useState<Locale[]>([]);
  const [hours, setHours] = useState<WeeklyAvailability>({});
  useEffect(() => { if (p) { setAbout(tx(p.about)); setLangs(p.languages); setHours(p.availability); } }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return null;
  const save = () => { update(pid, { about: { ...p.about, [locale]: about }, languages: langs, availability: hours }); toast.success(t("common.saved")); };
  const wd = raw<string[]>("profile.weekdays");
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("pdash.profile")} action={<Button asChild variant="outline"><Link href={`/provider/${p.id}`}><Eye />{t("pdash.publicProfile")}</Link></Button>} />
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar src={p.avatar} name={p.name} className="h-20 w-20" />
        <div className="flex-1">
          <p className="flex items-center gap-2 font-display text-xl font-bold">{p.name}{p.verified && <BadgeCheck className="h-5 w-5 fill-success text-white" />}</p>
          <p className="text-muted-foreground">{tx(p.profession)} · {tx(getCategory(p.categoryId)?.name)} · {tx(getCity(p.citySlug)?.name)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{p.badges.map((b) => <ProviderBadge key={b} b={b} />)}</div>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success-soft/60 p-4 text-sm"><p className="flex items-center gap-2 font-semibold text-success"><ShieldCheck className="h-4 w-4" />{t("reg.approved")}</p><p className="mt-1 text-xs text-muted-foreground">ID · {t("auth.phone")} · {t("reg.document")}</p></div>
      </Card>
      <Card className="space-y-5 p-6">
        <div><Label>{t("reg.description")}</Label><Textarea value={about} onChange={(e) => setAbout(e.target.value)} className="min-h-[140px]" /></div>
        <div><Label>{t("profile.languages")}</Label><div className="flex gap-4">{(["uz", "ru", "en"] as Locale[]).map((l) => <label key={l} className="flex items-center gap-2 text-sm"><Checkbox checked={langs.includes(l)} onCheckedChange={(v) => setLangs(v ? [...langs, l] : langs.filter((x) => x !== l))} />{t(`profile.langNames.${l}`)}</label>)}</div></div>
      </Card>
      <Card className="p-6">
        <p className="mb-4 font-display text-lg font-semibold">{t("pdash.workingHours")}</p>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const h = hours[d];
            return (
              <div key={d} className="flex items-center gap-4 rounded-2xl border p-3">
                <label className="flex w-28 items-center gap-2 text-sm font-semibold"><Checkbox checked={!!h} onCheckedChange={(v) => setHours({ ...hours, [d]: v ? [9, 18] : null })} />{wd[d]}</label>
                {h ? <div className="flex items-center gap-2 text-sm"><Input type="number" min={0} max={23} value={h[0]} onChange={(e) => setHours({ ...hours, [d]: [Number(e.target.value), h[1]] })} className="h-9 w-20" />—<Input type="number" min={1} max={24} value={h[1]} onChange={(e) => setHours({ ...hours, [d]: [h[0], Number(e.target.value)] })} className="h-9 w-20" /></div> : <span className="text-sm text-muted-foreground">{t("profile.dayOff")}</span>}
              </div>
            );
          })}
        </div>
      </Card>
      <Button size="lg" onClick={save}>{t("common.save")}</Button>
    </div>
  );
}
