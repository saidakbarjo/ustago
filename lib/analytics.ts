import type { Booking, Locale } from "@/lib/types";
import { LOCALE_TAGS } from "@/lib/i18n";

const UZ_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const UZ_DAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export function monthLabel(d: Date, locale: Locale) {
  if (locale === "uz") return UZ_MONTHS[d.getMonth()];
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: "short" }).format(d).replace(".", "");
}
export function dayLabel(d: Date, locale: Locale) {
  if (locale === "uz") return UZ_DAYS[d.getDay()];
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { weekday: "short" }).format(d);
}

/** 12-month series: deterministic historical baseline + real completed bookings from the store */
export function monthlySeries(bookings: Booking[], locale: Locale, opts: { base: number; growth: number; seed?: number }) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const real = bookings.filter((b) => b.status === "completed" && b.date.startsWith(key));
    const wave = 1 + Math.sin((i + (opts.seed ?? 0)) * 1.3) * 0.025;
    const baseline = Math.round(opts.base * Math.pow(1 + opts.growth, i) * wave);
    const baseCount = Math.round(baseline / 120000);
    return {
      label: monthLabel(d, locale),
      earnings: baseline + real.reduce((s, b) => s + b.price, 0),
      bookings: baseCount + real.length,
      customers: Math.round(baseCount * 0.62) + new Set(real.map((b) => b.userId)).size,
      repeat: Math.round(baseCount * 0.38),
    };
  });
}

export function weeklySeries(bookings: Booking[], locale: Locale) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - 6 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const day = bookings.filter((b) => b.date === key);
    return { label: dayLabel(d, locale), completed: day.filter((b) => b.status === "completed").length + 2 + ((i * 3) % 4), new: day.filter((b) => b.status !== "completed").length + 1 + (i % 3) };
  });
}

export const pctDelta = (a: number, b: number) => (b === 0 ? "+0%" : `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`);
