"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Clock, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { PriceUnit, ProviderService } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export default function ServicesPage() {
  const { t, tx, price, locale } = useI18n();
  const { provider: p, pid } = useMyProvider();
  const update = useStore((s) => s.updateProvider);
  const [edit, setEdit] = useState<ProviderService | null>(null);
  const [form, setForm] = useState({ name: "", price: 100000, unit: "job" as PriceUnit, durationMin: 60 });
  if (!p) return null;
  const open = (s?: ProviderService) => { setEdit(s ?? { id: "", name: { uz: "", ru: "", en: "" }, price: 0, unit: "job", durationMin: 60 }); setForm(s ? { name: tx(s.name), price: s.price, unit: s.unit, durationMin: s.durationMin } : { name: "", price: 100000, unit: "job", durationMin: 60 }); };
  const save = () => {
    if (!edit || !form.name.trim()) return;
    const name = edit.id ? { ...edit.name, [locale]: form.name } : { uz: form.name, ru: form.name, en: form.name };
    const svc: ProviderService = { id: edit.id || `${pid}-s${Date.now()}`, name, price: form.price, unit: form.unit, durationMin: form.durationMin };
    const services = edit.id ? p.services.map((s) => (s.id === edit.id ? svc : s)) : [...p.services, svc];
    update(pid, { services, priceFrom: Math.min(...services.map((s) => s.price)) });
    toast.success(t("common.saved")); setEdit(null);
  };
  const remove = (id: string) => { const services = p.services.filter((s) => s.id !== id); update(pid, { services, priceFrom: Math.min(...services.map((s) => s.price), p.priceFrom) }); };
  return (
    <div className="max-w-4xl">
      <PageHeader title={t("pdash.services")} action={<Button onClick={() => open()}><Plus />{t("pdash.addService")}</Button>} />
      {p.services.length === 0 ? <EmptyState icon={<Wrench />} title={t("admin.noItems")} /> : (
        <Card className="divide-y p-0">
          {p.services.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary"><Wrench className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{tx(s.name)}</p><p className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" />{s.durationMin} {t("common.min")} · {t(`units.${s.unit}`)}</p></div>
              <p className="font-display text-lg font-bold">{price(s.price)}</p>
              <Button variant="ghost" size="icon-sm" onClick={() => open(s)} aria-label={t("common.edit")}><Pencil /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => remove(s.id)} aria-label={t("common.delete")} className="text-destructive hover:bg-red-50"><Trash2 /></Button>
            </div>
          ))}
        </Card>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent title={edit?.id ? t("common.edit") : t("pdash.addService")}>
          <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <div><Label>{t("pdash.serviceName")}</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("pdash.price")}</Label><Input type="number" min={1000} step={1000} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label>{t("pdash.unit")}</Label><Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as PriceUnit })}>{(["job", "hour", "visit", "lesson", "sqm"] as PriceUnit[]).map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}</Select></div>
            </div>
            <div><Label>{t("pdash.duration")}</Label><Input type="number" min={15} step={15} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} /></div>
            <Button type="submit" className="w-full" size="lg">{t("common.save")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
