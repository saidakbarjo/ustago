"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, MapPin, Search, Sparkles, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { CITIES, getCategory } from "@/lib/data/catalog";
import { suggest } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/icons";
import { cn, haversineKm } from "@/lib/utils";

function useTypewriter(words: string[], active: boolean) {
  const [text, setText] = useState("");
  const [i, setI] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (!active) return;
    const w = words[i % words.length];
    const tm = setTimeout(() => {
      if (!del) { const next = w.slice(0, text.length + 1); setText(next); if (next === w) setTimeout(() => setDel(true), 1600); }
      else { const next = w.slice(0, text.length - 1); setText(next); if (!next) { setDel(false); setI((x) => x + 1); } }
    }, del ? 28 : 55);
    return () => clearTimeout(tm);
  }, [text, del, i, words, active]);
  return text;
}

export function SearchBar({ size = "xl", defaultQuery = "", defaultCity = "tashkent", className }: { size?: "xl" | "md"; defaultQuery?: string; defaultCity?: string; className?: string }) {
  const { t, raw, locale, tx } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);
  const [city, setCity] = useState(defaultCity);
  const [focus, setFocus] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const examples = raw<string[]>("hero.examples");
  const typed = useTypewriter(examples, !q && !focus && size === "xl");
  const sug = suggest(q, locale);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) { setFocus(false); setCityOpen(false); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (opts: { service?: string; query?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.service) p.set("service", opts.service);
    else if ((opts.query ?? q).trim()) p.set("q", (opts.query ?? q).trim());
    if (city) p.set("city", city);
    setFocus(false);
    router.push(`/search?${p.toString()}`);
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const nearest = [...CITIES].sort((a, b) => haversineKm(a, here) - haversineKm(b, here))[0];
      setCity(nearest.slug); setCityOpen(false);
    });
  };

  const big = size === "xl";
  return (
    <div ref={wrap} className={cn("relative", className)}>
      <form onSubmit={(e) => { e.preventDefault(); const s = sug[hi]; if (focus && s && q.length > 1) go({ service: s.slug }); else go(); }}
        className={cn("relative flex flex-col gap-2 rounded-[26px] border border-white/80 bg-white p-2 shadow-[0_24px_60px_-20px_rgba(30,41,90,.28)] ring-1 ring-black/[0.03] transition-shadow sm:flex-row sm:items-center sm:gap-0 sm:rounded-full", focus && "shadow-[0_30px_70px_-20px_rgba(58,85,255,.35)]")}>
        <label className="flex flex-1 items-center gap-3 pl-4 sm:pl-5">
          <Search className={cn("shrink-0 text-primary", big ? "h-5 w-5" : "h-4 w-4")} />
          <span className="relative flex-1">
            <input value={q} onChange={(e) => { setQ(e.target.value); setHi(0); }} onFocus={() => { setFocus(true); setCityOpen(false); }}
              onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, sug.length - 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); } }}
              aria-label={t("hero.placeholder")} placeholder={big ? "" : t("hero.placeholder")}
              className={cn("w-full bg-transparent font-medium outline-none placeholder:text-muted-foreground/70", big ? "h-12 text-[17px]" : "h-10 text-[15px]")} />
            {big && !q && (
              <span className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden whitespace-nowrap text-[17px] text-muted-foreground/80">
                {focus ? t("hero.placeholder") : <>{typed || t("hero.placeholder")}<span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-primary/70" /></>}
              </span>
            )}
          </span>
        </label>
        <div className="mx-2 hidden h-8 w-px bg-border sm:block" />
        <button type="button" onClick={() => { setCityOpen((o) => !o); setFocus(false); }} className={cn("flex items-center gap-2 rounded-full px-4 text-left transition hover:bg-secondary sm:px-3", big ? "h-12" : "h-10")}>
          <MapPin className="h-[18px] w-[18px] text-primary" />
          <span className="flex flex-col leading-tight">
            {big && <span className="text-[11px] text-muted-foreground">{t("hero.city")}</span>}
            <span className="text-sm font-semibold">{tx(CITIES.find((c) => c.slug === city)?.name)}</span>
          </span>
        </button>
        <Button type="submit" size={big ? "xl" : "lg"} className="sm:ml-1">{t("hero.cta")}<ArrowRight /></Button>
      </form>

      <AnimatePresence>
        {focus && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-[24px] border bg-white p-2 shadow-lift sm:right-[38%]">
            {sug.length > 0 ? sug.map((s, i) => {
              const cat = getCategory(s.categoryId)!;
              return (
                <button key={s.slug} onMouseEnter={() => setHi(i)} onClick={() => go({ service: s.slug })} className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition", hi === i && "bg-secondary")}>
                  <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white", cat.tone)}><CategoryIcon icon={cat.icon} className="h-4 w-4" /></span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{s.label}</span><span className="block text-xs text-muted-foreground">{s.query}</span></span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            }) : (
              <div className="p-2">
                <p className="flex items-center gap-1.5 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" />{t("hero.popular")}</p>
                {examples.map((ex) => (
                  <button key={ex} onClick={() => { setQ(ex); go({ query: ex }); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-secondary">
                    <Search className="h-4 w-4 text-muted-foreground" />{ex}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {cityOpen && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            className="absolute right-0 top-[calc(100%+10px)] z-40 w-full overflow-hidden rounded-[24px] border bg-white p-2 shadow-lift sm:w-72">
            <button onClick={locate} className="mb-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"><Navigation className="h-4 w-4" />GPS</button>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-1">
              {CITIES.map((c) => (
                <button key={c.slug} onClick={() => { setCity(c.slug); setCityOpen(false); }} className={cn("flex items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-secondary", city === c.slug && "bg-secondary font-semibold")}>
                  {tx(c.name)}{city === c.slug && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
