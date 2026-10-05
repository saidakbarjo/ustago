"use client";
import Link from "next/link";
import { Logo, Social } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import { LangSwitcher } from "./navbar";

export function Footer() {
  const { t } = useI18n();
  const cols = [
    { title: t("footer.customers"), links: [["/search", t("footer.findPro")], ["/categories", t("footer.allCategories")], ["/cities", t("footer.cities")], ["/#how-it-works", t("footer.howItWorks")]] },
    { title: t("footer.specialists"), links: [["/become-a-specialist", t("footer.join")], ["/pricing", t("footer.pricing")], ["/provider-dashboard", t("footer.dashboard")], ["/pricing#promotion", t("footer.promote")]] },
    { title: t("footer.company"), links: [["/#why", t("footer.about")], ["/#", t("footer.careers")], ["/#", t("footer.press")], ["/#", t("footer.blog")]] },
    { title: t("footer.support"), links: [["/#faq", t("footer.help")], ["mailto:support@ustago.uz", t("footer.contact")], ["/#trust", t("footer.safety")], ["/#trust", t("footer.protection")]] },
    { title: t("footer.legal"), links: [["/#", t("footer.terms")], ["/#", t("footer.privacy")], ["/#", t("footer.cookies")], ["/#", t("footer.offer")]] },
  ];
  return (
    <footer className="border-t bg-white pb-24 md:pb-0">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_3fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
            <div className="mt-6 flex gap-2">
              {[Social.Telegram, Social.Instagram, Social.Facebook, Social.YouTube, Social.LinkedIn].map((I, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-10 w-10 place-items-center rounded-full border text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"><I className="h-4 w-4" /></a>
              ))}
            </div>
            <div className="mt-6 text-sm"><p className="font-semibold">+998 71 200 00 00</p><p className="text-muted-foreground">support@ustago.uz</p></div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="mb-4 text-sm font-semibold">{c.title}</p>
                <ul className="space-y-2.5">
                  {c.links.map(([href, label]) => <li key={label}><Link href={href} className="text-sm text-muted-foreground transition hover:text-foreground">{label}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <div>
            <p>© {new Date().getFullYear()} USTAGO. {t("footer.rights")} · {t("footer.madeIn")}</p>
            <p className="mt-1 font-semibold text-foreground">Saidakbar loyihasi</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">{["Click", "Payme", "Uzum", "VISA", "Mastercard"].map((p) => <span key={p} className="rounded-md border px-2 py-1">{p}</span>)}</div>
            <LangSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
