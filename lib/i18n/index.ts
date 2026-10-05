import en, { type Dict } from "./en";
import ru from "./ru";
import uz from "./uz";
import type { Locale, LText } from "@/lib/types";

export const LOCALES: Locale[] = ["uz", "ru", "en"];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "ustago_locale";
export const DICTS: Record<Locale, Dict> = { uz, ru, en };
export const LOCALE_TAGS: Record<Locale, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as string[]).includes(v);

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function interpolate(s: string, params?: Record<string, string | number>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
}

export function makeT(locale: Locale) {
  const dict = DICTS[locale];
  const t = (key: string, params?: Record<string, string | number>): string => {
    const v = get(dict, key) ?? get(en, key);
    return typeof v === "string" ? interpolate(v, params) : key;
  };
  /** returns raw value (arrays/objects) */
  const raw = <T = unknown>(key: string): T => (get(dict, key) ?? get(en, key)) as T;
  const tx = (l?: LText | null) => (l ? l[locale] || l.en : "");
  const price = (n: number) => formatPrice(n, locale);
  return { t, raw, tx, price, locale, dict };
}

export function formatNumber(n: number, locale: Locale = "uz") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(Math.round(n)).replace(/ | /g, " ");
}

export function formatPrice(n: number, locale: Locale = "uz") {
  const num = formatNumber(n, locale);
  if (locale === "en") return `${num} UZS`;
  if (locale === "ru") return `${num} сум`;
  return `${num} soʻm`;
}

export function formatCompact(n: number) {
  const t = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, ""));
  if (n >= 1e9) return `${t(n / 1e9)}B`;
  if (n >= 1e6) return `${t(n / 1e6)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return String(n);
}

export function formatDate(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (locale === "uz") {
    const months = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
    const monthsLong = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
    const wd = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
    const m = opts.month === "long" ? monthsLong[d.getMonth()] : months[d.getMonth()];
    let s = `${d.getDate()}-${m}`;
    if (opts.year) s += `, ${d.getFullYear()}`;
    if (opts.weekday) s = `${wd[d.getDay()]}, ${s}`;
    return s;
  }
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], opts).format(d);
}

export function relativeTime(iso: string, locale: Locale) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (locale === "uz") {
    if (diff < 60) return "hozirgina";
    if (diff < 3600) return `${Math.round(diff / 60)} daqiqa oldin`;
    if (diff < 86400) return `${Math.round(diff / 3600)} soat oldin`;
    if (diff < 86400 * 30) return `${Math.round(diff / 86400)} kun oldin`;
    return formatDate(iso, locale);
  }
  const rtf = new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" });
  if (diff < 60) return rtf.format(0, "minute");
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  return formatDate(iso, locale);
}

export type { Dict };
