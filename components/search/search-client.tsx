"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { List, Map as MapIcon, SlidersHorizontal, X, SearchX, BadgeCheck, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { CATEGORIES, CITIES, getCity, getServiceType } from "@/lib/data/catalog";
import { filterProviders, matchQuery, type SearchFilters } from "@/lib/search";
import { useProviders, useStore, useHydrated } from "@/lib/store";
import { ProviderCard, ProviderCardSkeleton } from "@/components/provider-card";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { Segmented, Slider, Switch, EmptyState } from "@/components/ui/misc";
import { CategoryIcon } from "@/components/icons";
import { cn, ymd } from "@/lib/utils";
import type { Locale } from "@/lib/types";

const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-[24px]" /> });

const num = (v: string | null) => (v ? Number(v) : undefined);

function readFilters(sp: URLSearchParams): SearchFilters {
  return {
    q: sp.get("q") ?? undefined, category: sp.get("category") ?? undefined, service: sp.get("service") ?? undefined,
    city: sp.get("city") ?? "tashkent", maxKm: num(sp.get("km")) ?? 25, priceMax: num(sp.get("price")), minRating: num(sp.get("rating")),
    availability: (sp.get("avail") as SearchFilters["availability"]) ?? "any", verifiedOnly: sp.get("verified") === "1",
    minExp: num(sp.get("exp")), lang: (sp.get("lang") as Locale) ?? "any", date: sp.get("date") ?? undefined,
    time: (sp.get("time") as SearchFilters["time"]) ?? "any", sort: (sp.get("sort") as SearchFilters["sort"]) ?? "recommended",
  };
}
function writeFilters(f: SearchFilters) {
  const p = new URLSearchParams();
  const set = (k: string, v: unknown, def?: unknown) => { if (v !== undefined && v !== "" && v !== def && v !== false) p.set(k, v === true ? "1" : String(v)); };
  set("q", f.q); set("category", f.category); set("service", f.service); set("city", f.city); set("km", f.maxKm, 25); set("price", f.priceMax);
  set("rating", f.minRating); set("avail", f.availability, "any"); set("verified", f.verifiedOnly); set("exp", f.minExp); set("lang", f.lang, "any");
  set("date", f.date); set("time", f.time, "any"); set("sort", f.sort, "recommended");
  return p.toString();
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition", active ? "border-primary bg-primary text-white shadow-glow" : "bg-white hover:border-foreground/20")}>
      {children}
    </button>
  );
}

function Filters({ f, set, reset, count }: { f: SearchFilters; set: (p: Partial<SearchFilters>) => void; reset: () => void; count: number }) {
  const { t, tx, price } = useI18n();
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-lg font-semibold"><SlidersHorizontal className="h-[18px] w-[18px]" />{t("search.filters")}</p>
        <button onClick={reset} className="text-sm font-semibold text-primary hover:underline">{t("search.reset")}</button>
      </div>
      <div>
        <Label>{t("search.category")}</Label>
        <Select value={f.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined, service: undefined, q: undefined })}>
          <option value="">{t("common.all")}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tx(c.name)}</option>)}
        </Select>
      </div>
      <div>
        <Label>{t("search.city")}</Label>
        <Select value={f.city} onChange={(e) => set({ city: e.target.value })}>
          {CITIES.map((c) => <option key={c.slug} value={c.slug}>{tx(c.name)}</option>)}
        </Select>
      </div>
      <div>
        <div className="flex items-center justify-between"><Label>{t("search.distance")}</Label><span className="text-sm font-semibold">{t("search.upTo", { n: f.maxKm ?? 25 })}</span></div>
        <Slider min={1} max={50} step={1} value={[f.maxKm ?? 25]} onValueChange={([v]) => set({ maxKm: v })} />
      </div>
      <div>
        <div className="flex items-center justify-between"><Label>{t("search.price")}</Label><span className="text-sm font-semibold">{f.priceMax ? t("search.priceUpTo", { price: price(f.priceMax) }) : t("search.any")}</span></div>
        <Slider min={50000} max={3000000} step={50000} value={[f.priceMax ?? 3000000]} onValueChange={([v]) => set({ priceMax: v >= 3000000 ? undefined : v })} />
      </div>
      <div>
        <Label>{t("search.rating")}</Label>
        <div className="flex flex-wrap gap-2">
          <Chip active={!f.minRating} onClick={() => set({ minRating: undefined })}>{t("search.any")}</Chip>
          {[4.5, 4.8, 4.9].map((r) => <Chip key={r} active={f.minRating === r} onClick={() => set({ minRating: r })}><Star className="h-3.5 w-3.5 fill-current" />{r}+</Chip>)}
        </div>
      </div>
      <div>
        <Label>{t("search.availability")}</Label>
        <Segmented className="w-full [&>button]:flex-1 [&>button]:justify-center" value={f.availability ?? "any"} onChange={(v) => set({ availability: v })}
          options={[{ value: "any", label: t("search.anytime") }, { value: "today", label: t("search.availableToday") }, { value: "week", label: t("search.availableWeek") }]} />
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-2xl border bg-white p-4">
        <span className="flex items-center gap-2 text-sm font-medium"><BadgeCheck className="h-[18px] w-[18px] text-success" />{t("search.verifiedOnly")}</span>
        <Switch checked={!!f.verifiedOnly} onCheckedChange={(v) => set({ verifiedOnly: v })} />
      </label>
      <div>
        <Label>{t("search.experience")}</Label>
        <div className="flex flex-wrap gap-2">
          <Chip active={!f.minExp} onClick={() => set({ minExp: undefined })}>{t("search.any")}</Chip>
          {[3, 5, 10].map((y) => <Chip key={y} active={f.minExp === y} onClick={() => set({ minExp: y })}>{t("search.years", { n: y })}</Chip>)}
        </div>
      </div>
      <div>
        <Label>{t("search.language")}</Label>
        <div className="flex flex-wrap gap-2">
          <Chip active={!f.lang || f.lang === "any"} onClick={() => set({ lang: "any" })}>{t("search.any")}</Chip>
          {(["uz", "ru", "en"] as Locale[]).map((l) => <Chip key={l} active={f.lang === l} onClick={() => set({ lang: l })}>{t(`profile.langNames.${l}`)}</Chip>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("search.date")}</Label>
          <input type="date" min={ymd(new Date())} value={f.date ?? ""} onChange={(e) => set({ date: e.target.value || undefined })}
            className="h-11 w-full rounded-2xl border border-input bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10" />
        </div>
        <div>
          <Label>{t("search.time")}</Label>
          <Select value={f.time ?? "any"} onChange={(e) => set({ time: e.target.value as SearchFilters["time"] })}>
            <option value="any">{t("search.anytime")}</option>
            <option value="morning">{t("search.morning")}</option>
            <option value="afternoon">{t("search.afternoon")}</option>
            <option value="evening">{t("search.evening")}</option>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("search.results", { n: count })}</p>
    </div>
  );
}

export function SearchClient() {
  const { t, tx } = useI18n();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const providers = useProviders();
  const promoted = useStore((s) => s.promotedIds);
  const [f, setF] = useState<SearchFilters>(() => readFilters(new URLSearchParams(sp.toString())));
  const [view, setView] = useState<"list" | "map">(sp.get("view") === "map" ? "map" : "list");
  const [loading, setLoading] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // sync from URL when user performs a new search from the search bar
  useEffect(() => { setF(readFilters(new URLSearchParams(sp.toString()))); }, [sp]);

  const set = (patch: Partial<SearchFilters>) => {
    const next = { ...f, ...patch };
    setF(next);
    const qs = writeFilters(next);
    router.replace(`${pathname}?${qs}${view === "map" ? "&view=map" : ""}`, { scroll: false });
  };
  const reset = () => set({ category: undefined, service: undefined, q: undefined, maxKm: 25, priceMax: undefined, minRating: undefined, availability: "any", verifiedOnly: false, minExp: undefined, lang: "any", date: undefined, time: "any" });

  const results = useMemo(() => filterProviders(providers, f, promoted), [providers, f, promoted]);
  // skeleton shimmer while "fetching"
  useEffect(() => { setLoading(true); const id = setTimeout(() => setLoading(false), 420); return () => clearTimeout(id); }, [f, hydrated]);

  const city = getCity(f.city ?? "tashkent")!;
  const svc = f.service ? getServiceType(f.service) : f.q ? matchQuery(f.q).service : undefined;
  const cat = f.category ? CATEGORIES.find((c) => c.id === f.category) : svc ? CATEGORIES.find((c) => c.id === svc.categoryId) : undefined;
  const heading = svc ? tx(svc.name) : cat ? tx(cat.name) : f.q ? `“${f.q}”` : t("search.title");

  return (
    <div className="pb-16">
      {/* top bar */}
      <div className="border-b bg-[linear-gradient(180deg,#f5f7ff,#fff)]">
        <div className="container py-6 md:py-8">
          <SearchBar size="md" defaultQuery={f.q ?? (svc ? tx(svc.name) : "")} defaultCity={f.city} key={`${f.q}-${f.service}-${f.city}`} className="max-w-3xl" />
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                {cat && <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white", cat.tone)}><CategoryIcon icon={cat.icon} className="h-5 w-5" /></span>}
                <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{heading} · <span className="text-muted-foreground">{tx(city.name)}</span></h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{t("search.results", { n: results.length })}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFilters(true)}><SlidersHorizontal />{t("search.filters")}</Button>
              <div className="min-w-[180px] flex-1 sm:flex-none">
                <Select value={f.sort} onChange={(e) => set({ sort: e.target.value as SearchFilters["sort"] })} className="h-9 rounded-full text-sm" aria-label={t("search.sort")}>
                  <option value="recommended">{t("search.sortRecommended")}</option>
                  <option value="rating">{t("search.sortRating")}</option>
                  <option value="price_asc">{t("search.sortPriceLow")}</option>
                  <option value="price_desc">{t("search.sortPriceHigh")}</option>
                  <option value="nearest">{t("search.sortNearest")}</option>
                </Select>
              </div>
              <Segmented value={view} onChange={(v) => { setView(v); router.replace(`${pathname}?${writeFilters(f)}${v === "map" ? "&view=map" : ""}`, { scroll: false }); }}
                options={[{ value: "list", label: <><List />{t("search.list")}</> }, { value: "map", label: <><MapIcon />{t("search.map")}</> }]} />
            </div>
          </div>
          {/* category quick chips */}
          <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => set({ category: f.category === c.id ? undefined : c.id, service: undefined, q: undefined })}
                className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition", cat?.id === c.id ? "border-ink bg-ink text-white" : "bg-white hover:border-foreground/20")}>
                <CategoryIcon icon={c.icon} className="h-4 w-4" />{tx(c.name)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[92px] max-h-[calc(100vh-110px)] overflow-y-auto rounded-[24px] border bg-white/70 p-6 shadow-soft scrollbar-none">
            <Filters f={f} set={set} reset={reset} count={results.length} />
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0">
          {view === "list" ? (
            loading ? <div className="grid gap-4">{[0, 1, 2, 3].map((i) => <ProviderCardSkeleton key={i} variant="row" />)}</div>
              : results.length === 0 ? (
                <EmptyState icon={<SearchX />} title={t("search.noResults")} text={t("search.noResultsHint")} action={<Button variant="outline" onClick={reset}>{t("search.reset")}</Button>} />
              ) : (
                <motion.div className="grid gap-4" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
                  {results.map(({ p, km }) => (
                    <motion.div key={p.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                      <ProviderCard p={p} variant="row" distanceKm={km} />
                    </motion.div>
                  ))}
                </motion.div>
              )
          ) : (
            <div className="relative h-[calc(100vh-180px)] min-h-[520px] overflow-hidden rounded-[28px] border shadow-soft">
              <MapView providers={results.map((r) => r.p)} center={city} activeId={active} onSelect={setActive} className="h-full w-full" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] p-3">
                <div className="pointer-events-auto flex snap-x gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {results.map(({ p, km }) => (
                    <div key={p.id} className="w-[min(420px,88vw)] shrink-0 snap-start" onMouseEnter={() => setActive(p.id)}>
                      <ProviderCard p={p} variant="row" distanceKm={km} highlight={active === p.id} />
                    </div>
                  ))}
                </div>
              </div>
              {results.length === 0 && <div className="absolute inset-0 z-[500] grid place-items-center bg-white/60 backdrop-blur-sm"><EmptyState icon={<SearchX />} title={t("search.noResults")} text={t("search.noResultsHint")} /></div>}
            </div>
          )}
        </section>
      </div>

      {/* mobile filters sheet */}
      <AnimatePresence>
        {mobileFilters && (
          <>
            <motion.div className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileFilters(false)} />
            <motion.div className="fixed inset-x-0 bottom-0 z-[91] max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-white p-6 pb-28 lg:hidden"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
              <button className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-secondary" onClick={() => setMobileFilters(false)} aria-label="close"><X className="h-4 w-4" /></button>
              <Filters f={f} set={set} reset={reset} count={results.length} />
              <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4"><Button className="w-full" size="lg" onClick={() => setMobileFilters(false)}>{t("search.showResults", { n: results.length })}</Button></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
