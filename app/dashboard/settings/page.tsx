"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { CITIES } from "@/lib/data/catalog";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card, Switch } from "@/components/ui/misc";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/smart-image";
import { LangSwitcher } from "@/components/layout/navbar";
import { toast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { t, tx } = useI18n();
  const user = useStore((s) => s.users.find((u) => u.id === s.session?.userId));
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const updateUser = useStore((s) => s.updateUser);
  const resetDemo = useStore((s) => s.resetDemo);
  const [form, setForm] = useState({ name: "", email: "", phone: "", citySlug: "tashkent" });
  useEffect(() => { if (user) setForm({ name: user.name, email: user.email, phone: user.phone, citySlug: user.citySlug }); }, [user]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("dash.settings")} />
      <Card className="p-6">
        <p className="mb-5 font-display text-lg font-semibold">{t("dash.settingsProfile")}</p>
        <div className="mb-6 flex items-center gap-4"><Avatar src={user?.avatar} name={form.name || "U"} className="h-16 w-16" /><div><p className="font-semibold">{form.name}</p><p className="text-sm text-muted-foreground">{form.email}</p></div></div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); updateUser(form); toast.success(t("common.saved")); }}>
          <div><Label>{t("dash.fullName")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>{t("dash.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label>{t("dash.phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>{t("dash.city")}</Label><Select value={form.citySlug} onChange={(e) => setForm({ ...form, citySlug: e.target.value })}>{CITIES.map((c) => <option key={c.slug} value={c.slug}>{tx(c.name)}</option>)}</Select></div>
          <div className="sm:col-span-2"><Button type="submit">{t("common.save")}</Button></div>
        </form>
      </Card>
      <Card className="p-6">
        <p className="mb-4 font-display text-lg font-semibold">{t("dash.settingsNotif")}</p>
        {([["email", t("dash.emailNotif")], ["sms", t("dash.smsNotif")], ["push", t("dash.pushNotif")]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center justify-between border-b py-4 last:border-0"><span className="text-sm font-medium">{l}</span><Switch checked={settings[k]} onCheckedChange={(v) => updateSettings({ [k]: v })} /></label>
        ))}
      </Card>
      <Card className="flex items-center justify-between p-6"><p className="font-semibold">{t("dash.language")}</p><LangSwitcher /></Card>
      <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{t("common.demoMode")}</p><Button variant="outline" onClick={() => { resetDemo(); toast.success("Reset"); }}>Reset demo data</Button></Card>
    </div>
  );
}
