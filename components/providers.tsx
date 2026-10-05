"use client";
import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { I18nProvider } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { Toaster } from "@/components/ui/toast";
import type { Locale } from "@/lib/types";

function StoreHydrator() {
  useEffect(() => { void useStore.persist.rehydrate(); }, []);
  return null;
}

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <I18nProvider initialLocale={locale}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <StoreHydrator />
        {children}
        <Toaster />
      </MotionConfig>
    </I18nProvider>
  );
}
