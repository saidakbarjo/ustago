"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, Check, FileCheck2, FileUp, Hourglass, ImagePlus, ShieldCheck, Sparkles, Trash2, Users, Wallet, CalendarDays, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { CATEGORIES, CITIES } from "@/lib/data/catalog";
import { useHydrated, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, Checkbox } from "@/components/ui/misc";
import { Avatar } from "@/components/ui/smart-image";
import { CategoryIcon } from "@/components/icons";
import { cn, fileToDataUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

function StatusScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const app = useStore((s) => s.applications.find((a) => a.id === s.myApplicationId));
  const approve = useStore((s) => s.approveApplication);
  const login = useStore((s) => s.login);
  if (!app) return null;
  const approved = app.status === "approved";
  const steps = [
    { t: t("admin.submitted"), done: true },
    { t: t("admin.verification"), done: approved, active: !approved },
    { t: t("reg.approved"), done: approved },
  ];
  return (
    <div className="container max-w-2xl py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden p-0 text-center shadow-lift">
          <div className={cn("relative px-6 pb-10 pt-12", approved ? "bg-gradient-to-b from-success-soft to-white" : "bg-gradient-to-b from-accent to-white")}>
            <motion.div key={app.status} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className={cn("mx-auto grid h-24 w-24 place-items-center rounded-[30px] text-white", approved ? "bg-success shadow-[0_24px_60px_-18px_rgba(22,163,74,.7)]" : "bg-primary shadow-glow")}>
              {approved ? <BadgeCheck className="h-12 w-12" /> : <Hourglass className="h-11 w-11 animate-[spin_3s_ease-in-out_infinite]" />}
            </motion.div>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">{approved ? <>✓ {t("reg.approved")}</> : t("reg.underReview")}</h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">{approved ? t("reg.approvedText") : t("reg.underReviewText")}</p>
          </div>
          <div className="px-6 pb-8">
            <ol className="mx-auto flex max-w-md items-center justify-between">
              {steps.map((s, i) => (
                <li key={i} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className={cn("grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold", s.done ? "border-success bg-success text-white" : s.active ? "border-primary text-primary" : "border-border text-muted-foreground")}>{s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}</span>
                    <span className="w-24 text-xs font-medium">{s.t}</span>
                  </div>
                  {i < steps.length - 1 && <span className={cn("mb-6 h-0.5 flex-1", steps[i + 1].done ? "bg-success" : "bg-border")} />}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {approved ? <Button size="lg" onClick={() => { login({ role: "provider" }); router.push("/provider-dashboard"); }}>{t("reg.goDashboard")}<ArrowRight /></Button>
                : <Button size="lg" variant="outline" onClick={() => { approve(app.id); toast.success(t("notif.verification_approved")); }}><ShieldCheck />{t("reg.simulate")}</Button>}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export function Registration() {
  const { t, tx, raw } = useI18n();
  const hydrated = useHydrated();
  const myApp = useStore((s) => s.myApplicationId);
  const submitApplication = useStore((s) => s.submitApplication);
  const user = useStore((s) => s.users.find((u) => u.id === s.session?.userId));
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState({ name: "", phone: "", city: "tashkent", category: "repair", services: "", experience: 3, price: 80000, description: "", from: "09:00", to: "19:00" });
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [photo, setPhoto] = useState<string>();
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [doc, setDoc] = useState<string>();
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Record<string, boolean>>({});
  const photoRef = useRef<HTMLInputElement>(null), portRef = useRef<HTMLInputElement>(null), docRef = useRef<HTMLInputElement>(null);
  const stepsLabels = raw<string[]>("reg.steps");
  const wd = raw<string[]>("profile.weekdays");

  if (hydrated && myApp) return <StatusScreen />;

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (step === 0) { if (!f.name.trim()) e.name = true; if (f.phone.replace(/\D/g, "").length < 9) e.phone = true; }
    if (step === 1) { if (!f.services.trim()) e.services = true; if (f.description.trim().length < 10) e.description = true; }
    if (step === 3) { if (!doc) e.doc = true; if (!agree) e.agree = true; }
    setErr(e);
    return Object.keys(e).length === 0;
  };
  const next = () => { if (!validate()) return; setDir(1); setStep((s) => s + 1); };
  const back = () => { setDir(-1); setStep((s) => s - 1); };
  const submit = () => {
    if (!validate()) return;
    submitApplication({ name: f.name, phone: f.phone, citySlug: f.city, categoryId: f.category, services: f.services, experienceYears: f.experience, priceFrom: f.price, description: f.description, photo, portfolio, hours: { from: f.from, to: f.to, days }, documentName: doc });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const fieldErr = (k: string) => err[k] && "border-destructive focus-visible:ring-destructive/10";

  return (
    <div className="bg-[linear-gradient(180deg,#f5f7ff,#fff_420px)]">
      <div className="container grid gap-10 py-10 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:py-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" />{t("become.eyebrow")}</span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{t("reg.title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("reg.subtitle")}</p>
          <p className="mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("reg.benefits")}</p>
          <ul className="mt-4 space-y-3">
            {[{ i: Users, t: t("become.b1") }, { i: CalendarDays, t: t("become.b2") }, { i: Wallet, t: t("become.b3") }, { i: BarChart3, t: t("plans.f.analytics") }].map((b) => (
              <li key={b.t} className="flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><b.i className="h-5 w-5" /></span><span className="font-medium">{b.t}</span></li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">{t("become.secondary")}: <Link href="/pricing" className="font-semibold text-primary">{t("nav.pricing")}</Link></p>
        </div>

        <Card className="p-6 shadow-lift sm:p-8">
          <ol className="mb-8 grid grid-cols-4 gap-2">
            {stepsLabels.map((s, i) => (
              <li key={s} className="flex flex-col gap-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><motion.div className="h-full bg-primary" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} /></div>
                <span className={cn("text-[11px] font-semibold sm:text-xs", i <= step ? "text-foreground" : "text-muted-foreground")}>{i + 1}. {s}</span>
              </li>
            ))}
          </ol>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.3 }} className="space-y-5">
              {step === 0 && <>
                <div className="flex items-center gap-5">
                  <button type="button" onClick={() => photoRef.current?.click()} className="group relative">
                    <Avatar src={photo} name={f.name || "?"} className="h-24 w-24 ring-4 ring-secondary" />
                    <span className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-primary text-white ring-4 ring-white transition group-hover:scale-110"><Camera className="h-4 w-4" /></span>
                  </button>
                  <div><p className="font-semibold">{t("reg.photo")}</p><button type="button" className="text-sm font-semibold text-primary" onClick={() => photoRef.current?.click()}>{t("reg.changePhoto")}</button></div>
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={async (e) => e.target.files?.[0] && setPhoto(await fileToDataUrl(e.target.files[0], 400))} />
                </div>
                <div><Label>{t("reg.name")} *</Label><Input className={cn(fieldErr("name"))} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={user?.name} />{err.name && <p className="mt-1 text-xs text-destructive">{t("reg.required")}</p>}</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{t("reg.phone")} *</Label><Input className={cn(fieldErr("phone"))} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998 90 000 00 00" inputMode="tel" />{err.phone && <p className="mt-1 text-xs text-destructive">{t("reg.required")}</p>}</div>
                  <div><Label>{t("reg.city")}</Label><Select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c.slug} value={c.slug}>{tx(c.name)}</option>)}</Select></div>
                </div>
              </>}
              {step === 1 && <>
                <div><Label>{t("reg.category")}</Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {CATEGORIES.map((c) => (
                      <button type="button" key={c.id} onClick={() => setF({ ...f, category: c.id })} className={cn("flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition", f.category === c.id ? "border-primary bg-accent text-primary ring-4 ring-primary/10" : "hover:border-foreground/20")}>
                        <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white", c.tone)}><CategoryIcon icon={c.icon} className="h-4 w-4" /></span>{tx(c.name)}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Label>{t("reg.services")} *</Label><Input className={cn(fieldErr("services"))} value={f.services} onChange={(e) => setF({ ...f, services: e.target.value })} placeholder={t("reg.servicesPlaceholder")} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{t("reg.experience")}</Label><Input type="number" min={0} max={60} value={f.experience} onChange={(e) => setF({ ...f, experience: Number(e.target.value) })} /></div>
                  <div><Label>{t("reg.price")}</Label><Input type="number" min={5000} step={5000} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} /></div>
                </div>
                <div><Label>{t("reg.description")} *</Label><Textarea className={cn(fieldErr("description"))} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={t("reg.descriptionPlaceholder")} /></div>
              </>}
              {step === 2 && <>
                <div>
                  <Label>{t("reg.portfolio")}</Label>
                  <input ref={portRef} type="file" accept="image/*" multiple hidden onChange={async (e) => { if (!e.target.files) return; const arr = await Promise.all(Array.from(e.target.files).slice(0, 8).map((x) => fileToDataUrl(x, 800))); setPortfolio((p) => [...p, ...arr].slice(0, 8)); }} />
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <button type="button" onClick={() => portRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-muted-foreground transition hover:border-primary/50 hover:text-primary"><ImagePlus className="h-6 w-6" /><span className="text-xs">{portfolio.length}/8</span></button>
                    {portfolio.map((src, i) => <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => setPortfolio((p) => p.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button></div>)}
                  </div>
                </div>
                <div><Label>{t("reg.days")}</Label>
                  <div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6, 0].map((d) => <button type="button" key={d} onClick={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])} className={cn("h-11 w-12 rounded-2xl border text-sm font-semibold transition", days.includes(d) ? "border-primary bg-primary text-white" : "bg-white")}>{wd[d]}</button>)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>{t("reg.from")}</Label><Input type="time" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
                  <div><Label>{t("reg.to")}</Label><Input type="time" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
                </div>
              </>}
              {step === 3 && <>
                <div>
                  <Label>{t("reg.document")} *</Label>
                  <p className="mb-3 text-sm text-muted-foreground">{t("reg.documentHint")}</p>
                  <input ref={docRef} type="file" accept=".pdf,image/*" hidden onChange={(e) => e.target.files?.[0] && setDoc(e.target.files[0].name)} />
                  <button type="button" onClick={() => docRef.current?.click()} className={cn("flex w-full items-center gap-4 rounded-[20px] border-2 border-dashed p-5 text-left transition hover:border-primary/50", doc && "border-solid border-success bg-success-soft/50", err.doc && "border-destructive")}>
                    <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", doc ? "bg-success text-white" : "bg-accent text-primary")}>{doc ? <FileCheck2 className="h-6 w-6" /> : <FileUp className="h-6 w-6" />}</span>
                    <span className="flex-1"><span className="block font-semibold">{doc ?? t("reg.uploadDoc")}</span><span className="text-xs text-muted-foreground">PDF, JPG, PNG · max 10MB</span></span>
                  </button>
                </div>
                <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
                  <p className="font-semibold">{f.name || "—"} · {tx(CATEGORIES.find((c) => c.id === f.category)?.name)}</p>
                  <p className="text-muted-foreground">{f.services} · {f.experience} {t("profile.years", { n: "" }).trim()} · {tx(CITIES.find((c) => c.slug === f.city)?.name)}</p>
                </div>
                <label className={cn("flex items-start gap-3 text-sm", err.agree && "text-destructive")}><Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />{t("reg.agree")}</label>
              </>}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <Button variant="ghost" onClick={back} disabled={step === 0}><ArrowLeft />{t("common.back")}</Button>
            {step < 3 ? <Button size="lg" onClick={next}>{t("common.next")}<ArrowRight /></Button> : <Button size="lg" onClick={submit}><ShieldCheck />{t("reg.submit")}</Button>}
          </div>
        </Card>
      </div>
    </div>
  );
}
