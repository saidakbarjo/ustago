"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, ShieldCheck, User, Smartphone, Star, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useStore, type Role } from "@/lib/store";
import { repo } from "@/lib/supabase/repository";
import { Logo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/misc";
import { LangSwitcher } from "@/components/layout/navbar";
import { Avatar, SmartImage } from "@/components/ui/smart-image";
import { PROVIDERS, categoryImage } from "@/lib/data/providers";
import { toast } from "@/components/ui/toast";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const login = useStore((s) => s.login);
  const [role, setRole] = useState<"customer" | "provider">(sp.get("role") === "provider" ? "provider" : "customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const next = sp.get("next");

  const go = (r: Role) => router.push(next ?? (r === "provider" ? "/provider-dashboard" : r === "admin" ? "/admin" : "/dashboard"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (repo.enabled) {
      const res = mode === "login" ? await repo.signIn(form.email, form.password) : await repo.signUp(form.email, form.password, { full_name: form.name, phone: form.phone, role });
      if (res?.error) { toast.error(res.error.message); setLoading(false); return; }
    } else await new Promise((r) => setTimeout(r, 500));
    if (mode === "signup" && role === "provider") { login({ role: "customer", name: form.name, email: form.email, phone: form.phone }); router.push("/become-a-specialist"); return; }
    login({ role, name: form.name || undefined, email: form.email || undefined, phone: form.phone || undefined });
    go(role);
  };
  const demo = (r: Role) => { login({ role: r }); go(r); };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between"><Link href="/"><Logo /></Link><LangSwitcher /></div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto my-auto w-full max-w-[400px] py-10">
          <h1 className="font-display text-3xl font-bold tracking-tight">{mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{mode === "login" ? t("auth.loginSub") : t("auth.signupSub")}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <>
                <div><Label>{t("auth.iAm")}</Label><Segmented className="w-full [&>button]:flex-1 [&>button]:justify-center" value={role} onChange={setRole} options={[{ value: "customer", label: <><User />{t("auth.asCustomer")}</> }, { value: "provider", label: <><Briefcase />{t("auth.asSpecialist")}</> }]} /></div>
                <div><Label htmlFor="name">{t("auth.name")}</Label><Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></div>
                <div><Label htmlFor="phone">{t("auth.phone")}</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 000 00 00" inputMode="tel" /></div>
              </>
            )}
            <div><Label htmlFor="email">{t("auth.email")}</Label><Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>
            <div>
              <div className="flex items-center justify-between"><Label htmlFor="password">{t("auth.password")}</Label>{mode === "login" && <a href="#" className="mb-1.5 text-xs font-semibold text-primary">{t("auth.forgot")}</a>}</div>
              <Input id="password" type="password" required minLength={4} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <>{t("auth.continue")}<ArrowRight /></>}</Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("auth.or")}<span className="h-px flex-1 bg-border" /></div>
          <div className="grid gap-2">
            <Button variant="outline" size="lg" onClick={() => demo("customer")}><svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" /></svg>{t("auth.google")}</Button>
            <Button variant="outline" size="lg" onClick={() => demo("customer")}><Smartphone />{t("auth.otp")}</Button>
          </div>
          <div className="mt-6 rounded-[20px] border border-dashed bg-secondary/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("auth.demoHint")}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => demo("customer")}><User />{t("common.customer")}</Button>
              <Button size="sm" variant="outline" onClick={() => demo("provider")}><Briefcase />{t("common.specialist")}</Button>
              <Button size="sm" variant="outline" onClick={() => demo("admin")}><ShieldCheck />{t("common.admin")}</Button>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "login" ? <>{t("auth.noAccount")} <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary">{t("nav.signup")}</Link></> : <>{t("auth.haveAccount")} <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-primary">{t("nav.login")}</Link></>}
          </p>
        </motion.div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <SmartImage src={categoryImage("home", 3, 1400)} alt="" className="absolute inset-0 h-full w-full opacity-50" tone="from-brand-700 via-indigo-800 to-violet-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <div className="glass mb-8 max-w-sm rounded-[24px] p-5 text-ink">
            <div className="flex items-center gap-3"><Avatar src={PROVIDERS[2].avatar} name={PROVIDERS[2].name} className="h-12 w-12" /><div><p className="flex items-center gap-1 font-semibold">{PROVIDERS[2].name}<BadgeCheck className="h-4 w-4 fill-success text-white" /></p><p className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />4.92 · 845</p></div></div>
          </div>
          <p className="max-w-md font-display text-4xl font-bold leading-tight tracking-tight">{t("hero.title")} <span className="text-brand-300">{t("hero.titleAccent")}</span></p>
          <p className="mt-3 max-w-md text-white/70">{t("hero.trustedBy")}</p>
        </div>
      </div>
    </div>
  );
}
