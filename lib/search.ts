import { CATEGORIES, SERVICE_TYPES, getCity } from "@/lib/data/catalog";
import type { Locale, Provider, ServiceType } from "@/lib/types";
import { haversineKm } from "@/lib/utils";

/** extra multilingual keywords → service slug (smart search) */
const KEYWORDS: Record<string, string[]> = {
  plumber: ["santex", "сантех", "plumb", "кран", "труб", "quvur", "smesitel", "смесит", "унитаз", "unitaz", "протеч", "oqyapti", "leak", "faucet", "kanal", "засор"],
  "ac-repair": ["konditsion", "кондиц", "aircon", "air condition", "ac ", "сплит", "split"],
  "appliance-repair": ["kir yuvish", "стирал", "washing", "холодил", "muzlatkich", "fridge", "техник", "texnika", "appliance"],
  "car-mechanic": ["mashina", "машин", "авто", "avto", "car", "mexanik", "механик", "двигат", "dvigatel", "engine", "tormoz", "тормоз"],
  "car-diagnostics": ["diagnost", "диагност"],
  handyman: ["usta", "мастер на час", "handyman", "javon", "полк", "shelf", "osish", "повесить"],
  "furniture-assembly": ["mebel", "мебел", "furniture", "shkaf", "шкаф", "ikea", "сборк"],
  cleaning: ["tozala", "уборк", "убрат", "clean", "клининг", "toza"],
  "carpet-cleaning": ["gilam", "ковр", "ковёр", "carpet"],
  "web-developer": ["sayt", "сайт", "website", "web", "dastur", "разработ", "developer", "app", "ilova", "прилож"],
  "computer-repair": ["kompyuter", "компьют", "noutbuk", "ноутбук", "laptop", "computer", "pc"],
  "english-tutor": ["ingliz", "англ", "english", "ielts", "repetitor", "репетит", "tutor"],
  "math-tutor": ["matemat", "математ", "math"],
  hairdresser: ["soch", "волос", "hair", "sartarosh", "парикмах", "стриж"],
  "makeup-artist": ["makiyaj", "макияж", "makeup", "make-up", "vizaj", "визаж"],
  photographer: ["foto", "фото", "photo", "syomka", "съёмк", "съемк"],
  videographer: ["video", "видео"],
  movers: ["yuk", "груз", "moving", "move", "koʻchish", "переезд", "газел", "gazel", "truck"],
  courier: ["kuryer", "курьер", "courier", "yetkaz", "достав", "deliver"],
  tiling: ["kafel", "плит", "tile", "кафел"],
  renovation: ["taʼmir", "ta'mir", "ремонт квартир", "renovat", "под ключ"],
  "interior-designer": ["interyer", "интерьер", "interior"],
  "graphic-designer": ["logo", "логотип", "dizayn", "дизайн", "design", "brend", "бренд"],
  electrician: ["elektr", "электр", "electric", "rozetka", "розетк", "socket", "lyustra", "люстр", "проводк", "sim", "свет", "light"],
};

export function matchQuery(q: string): { service?: ServiceType; categoryId?: string } {
  const s = ` ${q.toLowerCase().trim()} `;
  if (!s.trim()) return {};
  let best: { slug: string; score: number } | null = null;
  for (const st of SERVICE_TYPES) {
    let score = 0;
    for (const loc of ["uz", "ru", "en"] as Locale[]) {
      const name = st.name[loc].toLowerCase();
      if (s.includes(name)) score += 10;
      else if (name.split(" ").some((w) => w.length > 3 && s.includes(w.slice(0, Math.max(4, w.length - 2))))) score += 4;
    }
    for (const kw of KEYWORDS[st.slug] ?? []) if (s.includes(kw)) score += kw.length > 4 ? 6 : 4;
    if (score > 0 && (!best || score > best.score)) best = { slug: st.slug, score };
  }
  if (best) { const service = SERVICE_TYPES.find((x) => x.slug === best!.slug)!; return { service, categoryId: service.categoryId }; }
  const cat = CATEGORIES.find((c) => (["uz", "ru", "en"] as Locale[]).some((l) => s.includes(c.name[l].toLowerCase())));
  return cat ? { categoryId: cat.id } : {};
}

export function suggest(q: string, locale: Locale, limit = 6) {
  const s = q.toLowerCase().trim();
  if (!s) return [];
  const m = matchQuery(q);
  const list = SERVICE_TYPES.filter((st) => (["uz", "ru", "en"] as Locale[]).some((l) => st.name[l].toLowerCase().includes(s) || st.query[l].toLowerCase().includes(s)));
  if (m.service && !list.includes(m.service)) list.unshift(m.service);
  return list.slice(0, limit).map((st) => ({ slug: st.slug, label: st.name[locale], query: st.query[locale], categoryId: st.categoryId }));
}

export interface SearchFilters {
  q?: string; category?: string; service?: string; city?: string; maxKm?: number; priceMax?: number; minRating?: number;
  availability?: "any" | "today" | "week"; verifiedOnly?: boolean; minExp?: number; lang?: Locale | "any";
  date?: string; time?: "any" | "morning" | "afternoon" | "evening";
  sort?: "recommended" | "rating" | "price_asc" | "price_desc" | "nearest";
}

export function isAvailableOn(p: Provider, date: Date, slot: SearchFilters["time"] = "any") {
  const h = p.availability[date.getDay()];
  if (!h) return false;
  if (slot === "morning") return h[0] < 12;
  if (slot === "afternoon") return h[0] < 17 && h[1] > 12;
  if (slot === "evening") return h[1] > 17;
  return true;
}

export function filterProviders(all: Provider[], f: SearchFilters, promotedIds: string[] = []) {
  const city = f.city ? getCity(f.city) : undefined;
  const m = f.q && !f.service && !f.category ? matchQuery(f.q) : {};
  const service = f.service ?? m.service?.slug;
  const category = f.category ?? m.categoryId;
  const today = new Date();
  let list = all.map((p) => ({ p, km: city ? haversineKm(city, p) : undefined }));
  list = list.filter(({ p, km }) => {
    if (category && p.categoryId !== category) return false;
    if (service && !p.serviceSlugs.includes(service) && !(m.service && p.categoryId === m.service.categoryId && !f.service)) return false;
    if (f.city && f.maxKm !== undefined && km !== undefined && km > f.maxKm) return false;
    if (f.priceMax && p.priceFrom > f.priceMax) return false;
    if (f.minRating && p.rating < f.minRating) return false;
    if (f.verifiedOnly && !p.verified) return false;
    if (f.minExp && p.experienceYears < f.minExp) return false;
    if (f.lang && f.lang !== "any" && !p.languages.includes(f.lang)) return false;
    if (f.date && !isAvailableOn(p, new Date(`${f.date}T00:00:00`), f.time)) return false;
    if (!f.date && f.time && f.time !== "any" && !isAvailableOn(p, today, f.time)) return false;
    if (f.availability === "today" && !isAvailableOn(p, today)) return false;
    if (f.availability === "week" && ![0, 1, 2, 3, 4, 5, 6].some((d) => p.availability[d])) return false;
    return true;
  });
  const score = (p: Provider) => p.rating * 20 + Math.log10(p.reviewsCount + 1) * 8 + (promotedIds.includes(p.id) ? 25 : 0) + (p.badges.includes("top") ? 6 : 0) - p.responseMinutes / 10;
  const sorters: Record<NonNullable<SearchFilters["sort"]>, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
    recommended: (a, b) => score(b.p) - score(a.p),
    rating: (a, b) => b.p.rating - a.p.rating || b.p.reviewsCount - a.p.reviewsCount,
    price_asc: (a, b) => a.p.priceFrom - b.p.priceFrom,
    price_desc: (a, b) => b.p.priceFrom - a.p.priceFrom,
    nearest: (a, b) => (a.km ?? 0) - (b.km ?? 0),
  };
  // nearby providers first when a city is chosen (out-of-city specialists are only shown with a large radius)
  return list.sort((a, b) => {
    if (city) { const ac = a.p.citySlug === city.slug ? 0 : 1, bc = b.p.citySlug === city.slug ? 0 : 1; if (ac !== bc) return ac - bc; }
    return sorters[f.sort ?? "recommended"](a, b);
  });
}

export function countByCategory(all: Provider[]) {
  // displayed counts: real seed providers scaled to realistic marketplace numbers
  const base: Record<string, number> = { repair: 1840, auto: 1215, home: 960, cleaning: 1430, it: 870, education: 1620, beauty: 1290, photo: 640, delivery: 1105, construction: 990, design: 410, electric: 1180 };
  const out: Record<string, number> = {};
  for (const c of CATEGORIES) out[c.id] = (base[c.id] ?? 100) + all.filter((p) => p.categoryId === c.id).length;
  return out;
}

export const CITY_COUNTS: Record<string, number> = { tashkent: 6420, samarkand: 1530, bukhara: 880, andijan: 940, namangan: 860, fergana: 910, qarshi: 540, nukus: 380, urgench: 470, jizzakh: 390 };
