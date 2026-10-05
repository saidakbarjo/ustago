import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, makeT } from "./index";
import type { Locale } from "@/lib/types";

export async function getServerLocale(): Promise<Locale> {
  // static export (GitHub Pages): pages are prerendered in the default language, the client switches afterwards
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT) return DEFAULT_LOCALE;
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export async function getServerT() {
  return makeT(await getServerLocale());
}
