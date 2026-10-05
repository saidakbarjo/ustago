"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, isLocale, makeT } from "./index";
import type { Locale } from "@/lib/types";

type Ctx = ReturnType<typeof makeT> & { setLocale: (l: Locale) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();
  // restore the saved language on static hosting (no server to read the cookie)
  useEffect(() => {
    const m = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=(\\w+)`));
    if (m && isLocale(m[1]) && m[1] !== initialLocale) { setLocaleState(m[1]); document.documentElement.lang = m[1]; }
  }, [initialLocale]);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = l;
    if (!process.env.NEXT_PUBLIC_STATIC_EXPORT) router.refresh(); // re-render server components (metadata)
  }, [router]);
  const value = useMemo(() => ({ ...makeT(locale), setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
