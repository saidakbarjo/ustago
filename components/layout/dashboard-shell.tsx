"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ShieldAlert, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/icons";
import { LangSwitcher, MobileTabBar, NotificationBell, UserMenu } from "@/components/layout/navbar";
import { useHydrated, useStore, type Role } from "@/lib/store";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavItem { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean }

function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const hydrated = useHydrated();
  const session = useStore((s) => s.session);
  const login = useStore((s) => s.login);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  useEffect(() => { if (hydrated && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [hydrated, session, router, pathname]);
  if (!hydrated || !session)
    return <div className="space-y-4 p-8"><div className="skeleton h-10 w-64" /><div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-32" />)}</div><div className="skeleton h-72" /></div>;
  if (session.role !== role)
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-md rounded-[28px] border bg-white p-8 text-center shadow-soft">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-warning-soft text-amber-600"><ShieldAlert className="h-6 w-6" /></span>
          <p className="mt-4 font-display text-xl font-semibold">{t("common.switchRole")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("common.signedInAs")} {t(`common.${session.role}`)}</p>
          <Button className="mt-6" onClick={() => login({ role })}>{t(`common.${role === "provider" ? "specialist" : role}`)} · demo</Button>
        </div>
      </div>
    );
  return <>{children}</>;
}

export function DashboardShell({ role, items, title, children, footer }: { role: Role; items: NavItem[]; title: string; children: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (it: NavItem) => (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/"));
  const audience = role === "provider" ? "provider" : role === "admin" ? "admin" : "user";

  const Nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-[68px] items-center px-6"><Link href="/"><Logo /></Link></div>
      <p className="px-6 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map((it) => {
          const active = isActive(it);
          return (
            <li key={it.href}>
              <Link href={it.href} className={cn("group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-ink text-white shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                <it.icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{it.label}</span>
                {!!it.badge && <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold", active ? "bg-white text-ink" : "bg-primary text-white")}>{it.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4">{footer}</div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r bg-white lg:block">{Nav}</aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-lift lg:hidden" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full bg-secondary" aria-label="close"><X className="h-4 w-4" /></button>
              {Nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center rounded-full border bg-white lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
            <span className="lg:hidden"><Logo /></span>
            <p className="hidden font-display text-lg font-semibold lg:block">{items.find(isActive)?.label ?? title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary md:inline-flex"><ExternalLink className="h-4 w-4" />USTAGO</Link>
            <LangSwitcher className="hidden sm:inline-flex" />
            <NotificationBell audience={audience} />
            <UserMenu />
          </div>
        </header>
        <main className="px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">
          <RoleGate role={role}>
            <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>{children}</motion.div>
          </RoleGate>
        </main>
        {role !== "admin" && <MobileTabBar />}
      </div>
      <span className="sr-only">{t("common.demoMode")}</span>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="font-display text-2xl font-bold tracking-tight sm:text-[30px]">{title}</h1>{subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}</div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, delta, tone = "brand", className }: { icon: LucideIcon; label: string; value: ReactNode; delta?: string; tone?: "brand" | "success" | "warning" | "violet" | "dark"; className?: string }) {
  const tones = { brand: "bg-accent text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-amber-600", violet: "bg-violet-50 text-violet-600", dark: "bg-ink text-white" };
  return (
    <motion.div whileHover={{ y: -3 }} className={cn("rounded-[24px] border border-border/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift", className)}>
      <div className="flex items-start justify-between">
        <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", tones[tone])}><Icon className="h-5 w-5" /></span>
        {delta && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", delta.startsWith("-") ? "bg-red-50 text-destructive" : "bg-success-soft text-success")}>{delta}</span>}
      </div>
      <p className="mt-4 font-display text-[28px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    pending: "bg-warning-soft text-amber-700", confirmed: "bg-accent text-primary", in_progress: "bg-violet-50 text-violet-700",
    completed: "bg-success-soft text-success", cancelled: "bg-secondary text-muted-foreground", paid: "bg-success-soft text-success",
    held: "bg-accent text-primary", unpaid: "bg-warning-soft text-amber-700", refunded: "bg-secondary text-muted-foreground", succeeded: "bg-success-soft text-success", failed: "bg-red-50 text-destructive",
  };
  const label = t(`dash.status.${status}`) !== `dash.status.${status}` ? t(`dash.status.${status}`) : t(`dash.paymentStatus.${status}`);
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", map[status] ?? "bg-secondary")}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}
