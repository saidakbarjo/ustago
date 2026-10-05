"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, Briefcase, X, Home, CalendarCheck, MessageCircle, User } from "lucide-react";
import { Logo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/smart-image";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALES } from "@/lib/i18n";
import { useHydrated, useStore, useUnreadCounts } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NotificationList } from "@/components/notifications";

export function LangSwitcher({ className, dark }: { className?: string; dark?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <div className={cn("inline-flex items-center rounded-full p-0.5 text-xs font-semibold", dark ? "bg-white/10" : "bg-secondary", className)} role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button key={l} onClick={() => setLocale(l)} aria-pressed={locale === l}
          className={cn("rounded-full px-2.5 py-1 uppercase transition", locale === l ? (dark ? "bg-white text-ink" : "bg-white text-foreground shadow-soft") : dark ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground")}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function UserMenu() {
  const { t } = useI18n();
  const session = useStore((s) => s.session);
  const logout = useStore((s) => s.logout);
  const login = useStore((s) => s.login);
  const user = useStore((s) => s.users.find((u) => u.id === s.session?.userId));
  const router = useRouter();
  if (!session) return null;
  return (
    <Dropdown>
      <DropdownTrigger className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 shadow-sm transition hover:shadow-soft">
        <Avatar src={session.role === "customer" ? user?.avatar : undefined} name={session.name} className="h-8 w-8" />
        <span className="hidden max-w-[110px] truncate text-sm font-semibold lg:block">{session.name.split(" ")[0]}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownLabel>{t("common.signedInAs")} <span className="font-semibold text-foreground">{session.email}</span></DropdownLabel>
        <DropdownSeparator />
        <DropdownItem onSelect={() => router.push(session.role === "provider" ? "/provider-dashboard" : session.role === "admin" ? "/admin" : "/dashboard")}><LayoutDashboard />{session.role === "provider" ? t("nav.providerDashboard") : session.role === "admin" ? t("nav.admin") : t("nav.dashboard")}</DropdownItem>
        <DropdownSeparator />
        <DropdownLabel>{t("common.switchRole")} · demo</DropdownLabel>
        <DropdownItem onSelect={() => { login({ role: "customer" }); router.push("/dashboard"); }}><User />{t("common.customer")}</DropdownItem>
        <DropdownItem onSelect={() => { login({ role: "provider" }); router.push("/provider-dashboard"); }}><Briefcase />{t("common.specialist")}</DropdownItem>
        <DropdownItem onSelect={() => { login({ role: "admin" }); router.push("/admin"); }}><ShieldCheck />{t("common.admin")}</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => { logout(); router.push("/"); }} className="text-destructive"><LogOut />{t("nav.logout")}</DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function NotificationBell({ audience = "user" }: { audience?: "user" | "provider" | "admin" }) {
  const counts = useUnreadCounts(audience === "admin" ? "user" : audience);
  const adminUnread = useStore((s) => s.notifications.filter((n) => n.audience === "admin" && !n.read).length);
  const hydrated = useHydrated();
  const n = hydrated ? (audience === "admin" ? adminUnread : counts.notifications) : 0;
  return (
    <Dropdown>
      <DropdownTrigger className="relative grid h-10 w-10 place-items-center rounded-full border bg-white shadow-sm transition hover:shadow-soft" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
        {n > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-white">{n}</span>}
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[360px] p-0">
        <NotificationList audience={audience} compact />
      </DropdownContent>
    </Dropdown>
  );
}

export function Navbar({ transparentTop = false }: { transparentTop?: boolean }) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const session = useStore((s) => s.session);
  const pathname = usePathname();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/search", label: t("nav.find") },
    { href: "/categories", label: t("nav.categories") },
    { href: "/#how-it-works", label: t("nav.how") },
    { href: "/become-a-specialist", label: t("nav.become") },
  ];
  const solid = scrolled || !transparentTop;

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", solid ? "border-b border-border/60 bg-white/80 backdrop-blur-xl" : "bg-transparent")}>
      <nav className="container flex h-[68px] items-center justify-between gap-4">
        <div className="flex items-center gap-6 xl:gap-10">
          <Link href="/" aria-label="USTAGO home"><Logo /></Link>
          <ul className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={cn("whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground", pathname === l.href && "text-foreground")}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitcher className="hidden sm:inline-flex" />
          {hydrated && session ? (
            <>
              <NotificationBell audience={session.role === "provider" ? "provider" : session.role === "admin" ? "admin" : "user"} />
              <UserMenu />
            </>
          ) : (
            <div className="hidden items-center gap-1 md:flex">
              <Button asChild variant="ghost" size="sm"><Link href="/login">{t("nav.login")}</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/signup">{t("nav.signup")}</Link></Button>
            </div>
          )}
          <Button asChild size="sm" className="hidden xl:inline-flex"><Link href="/search"><Search />{t("nav.find")}</Link></Button>
          <button className="grid h-10 w-10 place-items-center rounded-full border bg-white lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t bg-white lg:hidden">
            <div className="container space-y-1 py-4">
              {links.map((l) => <Link key={l.href} href={l.href} className="block rounded-2xl px-4 py-3 font-medium hover:bg-secondary">{l.label}</Link>)}
              <Link href="/cities" className="block rounded-2xl px-4 py-3 font-medium hover:bg-secondary">{t("nav.cities")}</Link>
              <Link href="/pricing" className="block rounded-2xl px-4 py-3 font-medium hover:bg-secondary">{t("nav.pricing")}</Link>
              <div className="flex items-center justify-between px-4 pt-3"><LangSwitcher />
                {!session && <div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link href="/login">{t("nav.login")}</Link></Button><Button asChild size="sm"><Link href="/signup">{t("nav.signup")}</Link></Button></div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function MobileTabBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const session = useStore((s) => s.session);
  const counts = useUnreadCounts("user");
  const base = session?.role === "provider" ? "/provider-dashboard" : "/dashboard";
  const items = [
    { href: "/", label: t("nav.home"), icon: Home, match: (p: string) => p === "/" },
    { href: "/search", label: t("nav.search"), icon: Search, match: (p: string) => p.startsWith("/search") },
    { href: session?.role === "provider" ? "/provider-dashboard/orders" : "/dashboard/bookings", label: t("nav.bookings"), icon: CalendarCheck, match: (p: string) => p.includes("bookings") || p.includes("orders") },
    { href: `${base}/messages`, label: t("nav.messages"), icon: MessageCircle, match: (p: string) => p.includes("messages"), badge: counts.messages },
    { href: session ? base : "/login", label: t("nav.profile"), icon: User, match: (p: string) => p === base || p.startsWith("/login") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Mobile">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <li key={it.label}>
              <Link href={it.href} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition", active ? "text-primary" : "text-muted-foreground")}>
                <span className={cn("relative grid h-8 w-12 place-items-center rounded-full transition", active && "bg-accent")}>
                  <it.icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  {!!it.badge && <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{it.badge}</span>}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
